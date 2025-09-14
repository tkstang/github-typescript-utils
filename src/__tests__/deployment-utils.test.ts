import { describe, expect, it, vi } from 'vitest';
import {
  createDeployment,
  deleteDeployment,
  getDeploymentStatuses,
  listDeployments,
  setDeploymentStatus,
} from '../deployment-utils.js';
import { createSimpleMockContext } from './test-utils.js';

describe('listDeployments', () => {
  it('should return list of deployments', async () => {
    const mockDeployments = [
      { id: 1, environment: 'production', ref: 'main' },
      { id: 2, environment: 'staging', ref: 'develop' },
    ];

    const mockGithub = {
      rest: {
        repos: {
          listDeployments: vi
            .fn()
            .mockResolvedValueOnce({ data: mockDeployments })
            .mockResolvedValueOnce({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await listDeployments({ ctx, repo });

    expect(result).toEqual(mockDeployments);
    expect(mockGithub.rest.repos.listDeployments).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      per_page: 100,
      page: 1,
    });
  });

  it('should filter by ref when provided', async () => {
    const mockGithub = {
      rest: {
        repos: {
          listDeployments: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    await listDeployments({ ctx, repo, ref: 'main' });

    expect(mockGithub.rest.repos.listDeployments).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      ref: 'main',
      per_page: 100,
      page: 1,
    });
  });

  it('should filter by environment when provided', async () => {
    const mockGithub = {
      rest: {
        repos: {
          listDeployments: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    await listDeployments({ ctx, repo, environment: 'production' });

    expect(mockGithub.rest.repos.listDeployments).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      environment: 'production',
      per_page: 100,
      page: 1,
    });
  });
});

describe('getDeploymentStatuses', () => {
  it('should return deployment statuses', async () => {
    const mockStatuses = [
      { id: 1, state: 'success' },
      { id: 2, state: 'pending' },
    ];

    const mockGithub = {
      rest: {
        repos: {
          listDeploymentStatuses: vi.fn().mockResolvedValue({ data: mockStatuses }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await getDeploymentStatuses({
      ctx,
      repo,
      deploymentId: 123,
    });

    expect(result).toEqual(mockStatuses);
    expect(mockGithub.rest.repos.listDeploymentStatuses).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      deployment_id: 123,
    });
  });
});

describe('setDeploymentStatus', () => {
  it('should create deployment status', async () => {
    const mockStatus = { id: 1, state: 'success' };
    const mockGithub = {
      rest: {
        repos: {
          createDeploymentStatus: vi.fn().mockResolvedValue({ data: mockStatus }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await setDeploymentStatus({
      ctx,
      repo,
      deploymentId: 123,
      state: 'success',
      description: 'Deployment successful',
    });

    expect(result).toEqual(mockStatus);
    expect(mockGithub.rest.repos.createDeploymentStatus).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      deployment_id: 123,
      state: 'success',
      description: 'Deployment successful',
    });
  });
});

describe('deleteDeployment', () => {
  it('should set deployment to inactive and delete it', async () => {
    const mockGithub = {
      rest: {
        repos: {
          createDeploymentStatus: vi.fn().mockResolvedValue({ data: {} }),
          deleteDeployment: vi.fn().mockResolvedValue({}),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    await deleteDeployment({ ctx, repo, deploymentId: 123 });

    expect(mockGithub.rest.repos.createDeploymentStatus).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      deployment_id: 123,
      state: 'inactive',
    });

    expect(mockGithub.rest.repos.deleteDeployment).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      deployment_id: 123,
    });
  });
});

describe('createDeployment', () => {
  it('should create a new deployment', async () => {
    const mockDeployment = { id: 123, environment: 'production' };
    const mockGithub = {
      rest: {
        repos: {
          createDeployment: vi.fn().mockResolvedValue({ data: mockDeployment }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await createDeployment({
      ctx,
      repo,
      ref: 'main',
      environment: 'production',
      description: 'Deploy to production',
    });

    expect(result).toEqual(mockDeployment);
    expect(mockGithub.rest.repos.createDeployment).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      ref: 'main',
      environment: 'production',
      auto_merge: true,
      description: 'Deploy to production',
    });
  });

  it('should include optional parameters when provided', async () => {
    const mockGithub = {
      rest: {
        repos: {
          createDeployment: vi.fn().mockResolvedValue({ data: {} }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    await createDeployment({
      ctx,
      repo,
      ref: 'main',
      environment: 'production',
      payload: { version: '1.0.0' },
      autoMerge: false,
      requiredContexts: ['ci/test'],
    });

    expect(mockGithub.rest.repos.createDeployment).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      ref: 'main',
      environment: 'production',
      auto_merge: false,
      payload: { version: '1.0.0' },
      required_contexts: ['ci/test'],
    });
  });
});
