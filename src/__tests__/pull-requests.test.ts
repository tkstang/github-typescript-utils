import { describe, expect, it, vi } from 'vitest';
import {
  addLabelsToPullRequest,
  findPullRequestsByLabels,
  getPullRequestFiles,
  pullRequestHasLabels,
  removeLabelsFromPullRequest,
} from '../pull-requests.js';
import { createSimpleMockContext } from './test-utils.js';

describe('findPullRequestsByLabels', () => {
  it('should find pull requests matching criteria', async () => {
    const mockPRs = [
      {
        number: 1,
        title: 'Fix bug',
        labels: [{ name: 'bug' }, { name: 'urgent' }],
        user: { login: 'alice' },
      },
      {
        number: 2,
        title: 'Add feature',
        labels: [{ name: 'feature' }],
        user: { login: 'bob' },
      },
      {
        number: 3,
        title: 'Another bug fix',
        labels: [{ name: 'bug' }],
        user: { login: 'alice' },
      },
    ];

    const mockGithub = {
      rest: {
        pulls: {
          list: vi
            .fn()
            .mockResolvedValueOnce({ data: mockPRs })
            .mockResolvedValueOnce({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await findPullRequestsByLabels({
      ctx,
      repo,
      options: {
        labels: ['bug'],
        state: 'open',
      },
    });

    expect(result).toHaveLength(2);
    expect(result[0].number).toBe(1);
    expect(result[1].number).toBe(3);
  });

  it('should handle empty results', async () => {
    const mockGithub = {
      rest: {
        pulls: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await findPullRequestsByLabels({
      ctx,
      repo,
      options: { labels: ['nonexistent'] },
    });

    expect(result).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    const mockPRs = Array.from({ length: 5 }, (_, i) => ({
      number: i + 1,
      title: `PR ${i + 1}`,
      labels: [{ name: 'test' }],
    }));

    const mockGithub = {
      rest: {
        pulls: {
          list: vi.fn().mockResolvedValue({ data: mockPRs }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await findPullRequestsByLabels({
      ctx,
      repo,
      options: {
        labels: ['test'],
        limit: 3,
      },
    });

    expect(result).toHaveLength(3);
  });
});

describe('addLabelsToPullRequest', () => {
  it('should add labels to pull request', async () => {
    const mockGithub = {
      rest: {
        issues: {
          addLabels: vi.fn().mockResolvedValue({
            data: [{ name: 'bug' }, { name: 'urgent' }],
          }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await addLabelsToPullRequest({
      ctx,
      repo,
      pullNumber: 123,
      labels: ['bug', 'urgent'],
    });

    expect(result).toBeUndefined();
    expect(mockGithub.rest.issues.addLabels).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      issue_number: 123,
      labels: ['bug', 'urgent'],
    });
    expect(ctx.core.info).toHaveBeenCalledWith('Adding labels to PR #123: bug, urgent');
  });
});

describe('removeLabelsFromPullRequest', () => {
  it('should remove labels from pull request', async () => {
    const mockGithub = {
      rest: {
        issues: {
          removeLabel: vi.fn().mockResolvedValue({}),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    await removeLabelsFromPullRequest({
      ctx,
      repo,
      pullNumber: 123,
      labels: ['bug', 'urgent'],
    });

    expect(mockGithub.rest.issues.removeLabel).toHaveBeenCalledTimes(2);
    expect(mockGithub.rest.issues.removeLabel).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      issue_number: 123,
      name: 'bug',
    });
    expect(mockGithub.rest.issues.removeLabel).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      issue_number: 123,
      name: 'urgent',
    });
    expect(ctx.core.info).toHaveBeenCalledWith('Removing labels from PR #123: bug, urgent');
  });

  it('should handle label removal errors gracefully', async () => {
    const mockGithub = {
      rest: {
        issues: {
          removeLabel: vi.fn().mockResolvedValueOnce({}).mockRejectedValueOnce({ status: 404 }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);
    ctx.core.warning = vi.fn();

    const repo = { owner: 'test', repo: 'test-repo' };
    await removeLabelsFromPullRequest({
      ctx,
      repo,
      pullNumber: 123,
      labels: ['existing', 'nonexistent'],
    });

    expect(ctx.core.info).toHaveBeenCalledWith("Label 'nonexistent' was not present on PR #123");
  });
});

describe('pullRequestHasLabels', () => {
  it('should return true when PR has all specified labels', async () => {
    const mockPR = {
      labels: [{ name: 'bug' }, { name: 'urgent' }, { name: 'frontend' }],
    };

    const mockGithub = {
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({ data: mockPR }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await pullRequestHasLabels({
      ctx,
      repo,
      pullNumber: 123,
      labels: ['bug', 'urgent'],
    });

    expect(result).toBe(true);
  });

  it('should return false when PR is missing some labels', async () => {
    const mockPR = {
      labels: [{ name: 'bug' }],
    };

    const mockGithub = {
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({ data: mockPR }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await pullRequestHasLabels({
      ctx,
      repo,
      pullNumber: 123,
      labels: ['bug', 'urgent'],
    });

    expect(result).toBe(false);
  });

  it('should return true for empty labels array', async () => {
    const mockPR = {
      labels: [{ name: 'bug' }],
    };

    const mockGithub = {
      rest: {
        pulls: {
          get: vi.fn().mockResolvedValue({ data: mockPR }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await pullRequestHasLabels({
      ctx,
      repo,
      pullNumber: 123,
      labels: [],
    });

    expect(result).toBe(true);
  });
});

describe('getPullRequestFiles', () => {
  it('should return list of changed files', async () => {
    const mockFiles = [
      {
        filename: 'src/index.ts',
        status: 'modified',
        additions: 10,
        deletions: 5,
        changes: 15,
        patch: "@@ -1,3 +1,4 @@\n console.log('test');",
      },
      {
        filename: 'README.md',
        status: 'added',
        additions: 20,
        deletions: 0,
        changes: 20,
        patch: '@@ -0,0 +1,20 @@\n# New README',
      },
      {
        filename: 'old-file.js',
        status: 'removed',
        additions: 0,
        deletions: 50,
        changes: 50,
        patch: undefined,
      },
    ];

    const mockGithub = {
      rest: {
        pulls: {
          listFiles: vi
            .fn()
            .mockResolvedValueOnce({ data: mockFiles })
            .mockResolvedValueOnce({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await getPullRequestFiles({
      ctx,
      repo,
      pullNumber: 123,
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      filename: 'src/index.ts',
      status: 'modified',
      additions: 10,
      deletions: 5,
      changes: 15,
      patch: "@@ -1,3 +1,4 @@\n console.log('test');",
    });
    expect(result[2]).toEqual({
      filename: 'old-file.js',
      status: 'removed',
      additions: 0,
      deletions: 50,
      changes: 50,
    });
  });

  it('should handle files without patches', async () => {
    const mockFiles = [
      {
        filename: 'binary-file.png',
        status: 'added',
        additions: 0,
        deletions: 0,
        changes: 0,
        patch: undefined,
      },
    ];

    const mockGithub = {
      rest: {
        pulls: {
          listFiles: vi.fn().mockResolvedValue({ data: mockFiles }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await getPullRequestFiles({
      ctx,
      repo,
      pullNumber: 123,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      filename: 'binary-file.png',
      status: 'added',
      additions: 0,
      deletions: 0,
      changes: 0,
    });
    expect(result[0]).not.toHaveProperty('patch');
  });
});
