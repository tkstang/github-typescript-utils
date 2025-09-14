import type { GitHubContext, PullRequest, RepoInfo } from './types.js';

/**
 * Options for searching pull requests
 */
export type AdvancedPRSearchOptions = {
  /**
   * Labels that must be present on the PR (AND logic)
   */
  labels?: string[];
  /**
   * PR state to filter by
   * @default 'open'
   */
  state?: 'open' | 'closed' | 'all';
  /**
   * Author username to filter by
   */
  author?: string;
  /**
   * Maximum number of PRs to return
   * @default 100
   */
  limit?: number;
  /**
   * Sort order
   * @default 'created'
   */
  sort?: 'created' | 'updated' | 'popularity' | 'long-running';
  /**
   * Sort direction
   * @default 'desc'
   */
  direction?: 'asc' | 'desc';
  /**
   * Exclude specific PR numbers
   */
  excludePRs?: number[];
};

/**
 * Finds pull requests with specific labels (all labels must be present)
 */
export async function findPRsWithLabels({
  ctx,
  repo,
  labels,
  state = 'open',
  limit = 100,
  excludePRs = [],
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  labels: string[];
  state?: 'open' | 'closed' | 'all';
  limit?: number;
  excludePRs?: number[];
}): Promise<PullRequest[]> {
  if (labels.length === 0) {
    throw new Error('At least one label must be specified');
  }

  ctx.core.info(`Searching for PRs with labels: ${labels.join(', ')}`);

  const pullRequests: PullRequest[] = [];
  let page = 1;
  const perPage = Math.min(limit * 2, 100); // Get more than needed for filtering

  while (pullRequests.length < limit) {
    const { data } = await ctx.github.rest.pulls.list({
      ...repo,
      state,
      per_page: perPage,
      page,
    });

    if (data.length === 0) {
      break;
    }

    // Filter PRs that have ALL specified labels and aren't excluded
    const matchingPRs = data.filter((pr) => {
      if (excludePRs.includes(pr.number)) {
        return false;
      }

      const prLabels = pr.labels.map((label) => (typeof label === 'string' ? label : label.name));
      return labels.every((requiredLabel) => prLabels.includes(requiredLabel));
    });

    pullRequests.push(...(matchingPRs as PullRequest[]));

    if (data.length < perPage || pullRequests.length >= limit) {
      break;
    }

    page++;
  }

  ctx.core.info(`Found ${pullRequests.length} PRs matching label criteria`);
  return pullRequests.slice(0, limit);
}

/**
 * Advanced pull request search with multiple criteria
 */
export async function searchPullRequests({
  ctx,
  repo,
  options,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  options: AdvancedPRSearchOptions;
}): Promise<PullRequest[]> {
  const {
    labels = [],
    state = 'open',
    author,
    limit = 100,
    sort = 'created',
    direction = 'desc',
    excludePRs = [],
  } = options;

  const pullRequests: PullRequest[] = [];
  let page = 1;
  const perPage = Math.min(limit * 2, 100);

  while (pullRequests.length < limit) {
    const { data } = await ctx.github.rest.pulls.list({
      ...repo,
      state,
      sort,
      direction,
      per_page: perPage,
      page,
    });

    if (data.length === 0) {
      break;
    }

    // Apply filters
    const filteredPRs = data.filter((pr) => {
      // Exclude specific PRs
      if (excludePRs.includes(pr.number)) {
        return false;
      }

      // Filter by author
      if (author && pr.user?.login !== author) {
        return false;
      }

      // Filter by labels (if specified)
      if (labels.length > 0) {
        const prLabels = pr.labels.map((label) => (typeof label === 'string' ? label : label.name));
        if (!labels.every((requiredLabel) => prLabels.includes(requiredLabel))) {
          return false;
        }
      }

      return true;
    });

    pullRequests.push(...(filteredPRs as PullRequest[]));

    if (data.length < perPage || pullRequests.length >= limit) {
      break;
    }

    page++;
  }

  return pullRequests.slice(0, limit);
}

/**
 * Finds open PRs with a specific label (convenience function)
 */
export async function findOpenPRsWithLabel({
  ctx,
  repo,
  label,
  excludePRs = [],
  limit = 100,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  label: string;
  excludePRs?: number[];
  limit?: number;
}): Promise<PullRequest[]> {
  return findPRsWithLabels({
    ctx,
    repo,
    labels: [label],
    state: 'open',
    excludePRs,
    limit,
  });
}

/**
 * Checks if a label is already in use by other open PRs
 */
export async function checkLabelConflicts({
  ctx,
  repo,
  prNumber,
  label,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  prNumber: number;
  label: string;
}): Promise<{ hasConflict: boolean; conflictingPR?: PullRequest }> {
  const conflictingPRs = await findOpenPRsWithLabel({
    ctx,
    repo,
    label,
    excludePRs: [prNumber],
    limit: 1,
  });

  if (conflictingPRs.length > 0) {
    const conflictingPR = conflictingPRs[0];

    if (conflictingPR) {
      return {
        hasConflict: true,
        conflictingPR,
      };
    }
  }

  return { hasConflict: false };
}
