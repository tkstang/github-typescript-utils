import { describe, expect, it, vi } from 'vitest';
import {
  checkBranchExists,
  getBranchProtection,
  getDefaultBranch,
  listAllBranches,
} from '../branch-utils.js';
import { createSimpleMockContext } from './test-utils.js';

describe('checkBranchExists', () => {
  it('should return true when branch exists', async () => {
    const mockGithub = {
      rest: {
        repos: {
          getBranch: vi.fn().mockResolvedValue({ data: { name: 'main' } }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await checkBranchExists({ ctx, repo, branch: 'main' });

    expect(result).toBe(true);
    expect(mockGithub.rest.repos.getBranch).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      branch: 'main',
    });
  });

  it('should return false when branch does not exist', async () => {
    const mockGithub = {
      rest: {
        repos: {
          getBranch: vi.fn().mockRejectedValue({ status: 404 }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await checkBranchExists({
      ctx,
      repo,
      branch: 'nonexistent',
    });

    expect(result).toBe(false);
  });

  it('should throw error for non-404 errors', async () => {
    const mockGithub = {
      rest: {
        repos: {
          getBranch: vi.fn().mockRejectedValue({ status: 500 }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };

    await expect(checkBranchExists({ ctx, repo, branch: 'main' })).rejects.toEqual({ status: 500 });
  });
});

describe('listAllBranches', () => {
  it('should return list of branch names', async () => {
    const mockGithub = {
      rest: {
        repos: {
          listBranches: vi
            .fn()
            .mockResolvedValueOnce({
              data: [{ name: 'main' }, { name: 'develop' }],
            })
            .mockResolvedValueOnce({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await listAllBranches({ ctx, repo });

    expect(result).toEqual(['main', 'develop']);
    expect(mockGithub.rest.repos.listBranches).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      per_page: 100,
      page: 1,
    });
  });

  it('should respect limit parameter', async () => {
    const mockGithub = {
      rest: {
        repos: {
          listBranches: vi.fn().mockResolvedValue({
            data: [{ name: 'main' }, { name: 'develop' }, { name: 'feature' }],
          }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await listAllBranches({ ctx, repo, limit: 2 });

    expect(result).toEqual(['main', 'develop']);
  });
});

describe('getBranchProtection', () => {
  it('should return protection rules when they exist', async () => {
    const mockProtection = { required_status_checks: null };
    const mockGithub = {
      rest: {
        repos: {
          getBranchProtection: vi.fn().mockResolvedValue({ data: mockProtection }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await getBranchProtection({ ctx, repo, branch: 'main' });

    expect(result).toEqual(mockProtection);
  });

  it('should return null when no protection rules exist', async () => {
    const mockGithub = {
      rest: {
        repos: {
          getBranchProtection: vi.fn().mockRejectedValue({ status: 404 }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await getBranchProtection({ ctx, repo, branch: 'main' });

    expect(result).toBeNull();
  });
});

describe('getDefaultBranch', () => {
  it('should return the default branch name', async () => {
    const mockGithub = {
      rest: {
        repos: {
          get: vi.fn().mockResolvedValue({ data: { default_branch: 'main' } }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await getDefaultBranch({ ctx, repo });

    expect(result).toBe('main');
    expect(mockGithub.rest.repos.get).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
    });
  });
});
