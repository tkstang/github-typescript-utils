import { describe, expect, it, vi } from 'vitest';
import {
  checkLabelConflicts,
  findOpenPRsWithLabel,
  findPRsWithLabels,
  searchPullRequests,
} from '../advanced-pr-utils.js';
import { createSimpleMockContext } from './test-utils.js';

describe('findPRsWithLabels', () => {
  it('should find PRs with all specified labels', async () => {
    const mockPRs = [
      {
        number: 1,
        labels: [{ name: 'bug' }, { name: 'urgent' }],
      },
      {
        number: 2,
        labels: [{ name: 'bug' }],
      },
      {
        number: 3,
        labels: [{ name: 'bug' }, { name: 'urgent' }, { name: 'frontend' }],
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
    const result = await findPRsWithLabels({
      ctx,
      repo,
      labels: ['bug', 'urgent'],
    });

    expect(result).toHaveLength(2);
    expect(result[0].number).toBe(1);
    expect(result[1].number).toBe(3);
    expect(ctx.core.info).toHaveBeenCalledWith('Searching for PRs with labels: bug, urgent');
  });

  it('should exclude specified PRs', async () => {
    const mockPRs = [
      {
        number: 1,
        labels: [{ name: 'bug' }],
      },
      {
        number: 2,
        labels: [{ name: 'bug' }],
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
    const result = await findPRsWithLabels({
      ctx,
      repo,
      labels: ['bug'],
      excludePRs: [1],
    });

    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(2);
  });

  it('should throw error when no labels specified', async () => {
    const ctx = createSimpleMockContext();

    const repo = { owner: 'test', repo: 'test-repo' };

    await expect(findPRsWithLabels({ ctx, repo, labels: [] })).rejects.toThrow(
      'At least one label must be specified'
    );
  });
});

describe('searchPullRequests', () => {
  it('should search PRs with multiple criteria', async () => {
    const mockPRs = [
      {
        number: 1,
        user: { login: 'alice' },
        labels: [{ name: 'bug' }],
      },
      {
        number: 2,
        user: { login: 'bob' },
        labels: [{ name: 'feature' }],
      },
      {
        number: 3,
        user: { login: 'alice' },
        labels: [{ name: 'bug' }],
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
    const result = await searchPullRequests({
      ctx,
      repo,
      options: {
        labels: ['bug'],
        author: 'alice',
        state: 'open',
      },
    });

    expect(result).toHaveLength(2);
    expect(result[0].number).toBe(1);
    expect(result[1].number).toBe(3);
    expect(mockGithub.rest.pulls.list).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      state: 'open',
      sort: 'created',
      direction: 'desc',
      per_page: 100,
      page: 1,
    });
  });

  it('should handle empty search results', async () => {
    const mockGithub = {
      rest: {
        pulls: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await searchPullRequests({
      ctx,
      repo,
      options: { labels: ['nonexistent'] },
    });

    expect(result).toHaveLength(0);
  });
});

describe('findOpenPRsWithLabel', () => {
  it('should find open PRs with specific label', async () => {
    const mockPRs = [
      {
        number: 1,
        labels: [{ name: 'bug' }],
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
    const result = await findOpenPRsWithLabel({
      ctx,
      repo,
      label: 'bug',
    });

    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(1);
  });
});

describe('checkLabelConflicts', () => {
  it('should detect label conflicts', async () => {
    const mockPRs = [
      {
        number: 2,
        labels: [{ name: 'sync-branch: sbntls-1' }],
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
    const result = await checkLabelConflicts({
      ctx,
      repo,
      prNumber: 1,
      label: 'sync-branch: sbntls-1',
    });

    expect(result.hasConflict).toBe(true);
    expect(result.conflictingPR?.number).toBe(2);
  });

  it('should return no conflict when label is not in use', async () => {
    const mockGithub = {
      rest: {
        pulls: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await checkLabelConflicts({
      ctx,
      repo,
      prNumber: 1,
      label: 'sync-branch: sbntls-1',
    });

    expect(result.hasConflict).toBe(false);
    expect(result.conflictingPR).toBeUndefined();
  });

  it('should exclude the current PR from conflict check', async () => {
    const mockPRs = [
      {
        number: 1,
        labels: [{ name: 'sync-branch: sbntls-1' }],
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
    const result = await checkLabelConflicts({
      ctx,
      repo,
      prNumber: 1,
      label: 'sync-branch: sbntls-1',
    });

    expect(result.hasConflict).toBe(false);
  });
});
