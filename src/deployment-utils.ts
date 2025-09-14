import type { GitHubContext, RepoInfo } from './types.js';

/**
 * Deployment structure from GitHub API
 */
export type Deployment = {
  id: number;
  sha: string;
  ref: string;
  task: string;
  payload: Record<string, unknown>;
  environment: string;
  description: string | null;
  creator: {
    login: string;
    id: number;
  } | null;
  created_at: string;
  updated_at: string;
  statuses_url: string;
  repository_url: string;
};

/**
 * Deployment status structure
 */
export type DeploymentStatus = {
  id: number;
  state: 'error' | 'failure' | 'inactive' | 'pending' | 'success' | 'queued' | 'in_progress';
  creator: {
    login: string;
    id: number;
  } | null;
  description: string | null;
  environment: string;
  target_url: string | null;
  created_at: string;
  updated_at: string;
  deployment_url: string;
  repository_url: string;
};

/**
 * Lists deployments for a repository or specific ref
 */
export async function listDeployments({
  ctx,
  repo,
  ref,
  environment,
  limit = 100,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  ref?: string;
  environment?: string;
  limit?: number;
}): Promise<Deployment[]> {
  const deployments: Deployment[] = [];
  let page = 1;
  const perPage = Math.min(limit, 100);

  while (deployments.length < limit) {
    const { data } = await ctx.github.rest.repos.listDeployments({
      ...repo,
      ...(ref && { ref }),
      ...(environment && { environment }),
      per_page: perPage,
      page,
    });

    if (data.length === 0) {
      break;
    }

    deployments.push(...(data as Deployment[]));

    if (data.length < perPage) {
      break;
    }

    page++;
  }

  return deployments.slice(0, limit);
}

/**
 * Gets deployment statuses for a specific deployment
 */
export async function getDeploymentStatuses({
  ctx,
  repo,
  deploymentId,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  deploymentId: number;
}): Promise<DeploymentStatus[]> {
  const { data } = await ctx.github.rest.repos.listDeploymentStatuses({
    ...repo,
    deployment_id: deploymentId,
  });

  return data as DeploymentStatus[];
}

/**
 * Creates a deployment status
 */
export async function setDeploymentStatus({
  ctx,
  repo,
  deploymentId,
  state,
  description,
  targetUrl,
  environment,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  deploymentId: number;
  state: 'error' | 'failure' | 'inactive' | 'pending' | 'success' | 'queued' | 'in_progress';
  description?: string;
  targetUrl?: string;
  environment?: string;
}): Promise<DeploymentStatus> {
  const { data } = await ctx.github.rest.repos.createDeploymentStatus({
    ...repo,
    deployment_id: deploymentId,
    state,
    ...(description && { description }),
    ...(targetUrl && { target_url: targetUrl }),
    ...(environment && { environment }),
  });

  return data as DeploymentStatus;
}

/**
 * Deletes a deployment
 */
export async function deleteDeployment({
  ctx,
  repo,
  deploymentId,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  deploymentId: number;
}): Promise<void> {
  // First set deployment to inactive
  await setDeploymentStatus({
    ctx,
    repo,
    deploymentId,
    state: 'inactive',
  });

  // Then delete the deployment
  await ctx.github.rest.repos.deleteDeployment({
    ...repo,
    deployment_id: deploymentId,
  });
}

/**
 * Creates a new deployment
 */
export async function createDeployment({
  ctx,
  repo,
  ref,
  environment,
  description,
  payload,
  autoMerge = true,
  requiredContexts,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  ref: string;
  environment: string;
  description?: string;
  payload?: Record<string, unknown>;
  autoMerge?: boolean;
  requiredContexts?: string[];
}): Promise<Deployment> {
  const { data } = await ctx.github.rest.repos.createDeployment({
    ...repo,
    ref,
    environment,
    auto_merge: autoMerge,
    ...(description && { description }),
    ...(payload && { payload }),
    ...(requiredContexts && { required_contexts: requiredContexts }),
  });

  return data as Deployment;
}
