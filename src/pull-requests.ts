import type {
  GitHubContext,
  RepoInfo,
  PullRequest,
  PullRequestSearchOptions,
} from "./types.js";

/**
 * Finds pull requests that have all of the specified labels
 */
export async function findPullRequestsByLabels({
  ctx,
  repo,
  options,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  options: PullRequestSearchOptions;
}): Promise<PullRequest[]> {
  const {
    labels,
    state = "open",
    limit = 30,
    sort = "created",
    direction = "desc",
  } = options;

  if (labels.length === 0) {
    throw new Error("At least one label must be specified");
  }

  ctx.core.info(`Searching for PRs with labels: ${labels.join(", ")}`);

  // Get pull requests with the specified state
  const { data: pullRequests } = await ctx.github.rest.pulls.list({
    ...repo,
    state,
    per_page: Math.min(limit * 2, 100), // Get more than needed for filtering
    sort,
    direction,
  });

  // Filter PRs that have ALL specified labels
  const matchingPRs = pullRequests.filter((pr) => {
    const prLabels = pr.labels.map((label) =>
      typeof label === "string" ? label : label.name
    );
    return labels.every((requiredLabel) => prLabels.includes(requiredLabel));
  });

  ctx.core.info(`Found ${matchingPRs.length} PRs matching label criteria`);
  return matchingPRs.slice(0, limit) as PullRequest[];
}

/**
 * Gets a specific pull request by number
 */
export async function getPullRequest({
  ctx,
  repo,
  pullNumber,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  pullNumber: number;
}): Promise<PullRequest> {
  ctx.core.info(`Getting pull request #${pullNumber}`);

  const { data: pullRequest } = await ctx.github.rest.pulls.get({
    ...repo,
    pull_number: pullNumber,
  });

  return pullRequest as PullRequest;
}

/**
 * Adds labels to a pull request
 */
export async function addLabelsToPullRequest({
  ctx,
  repo,
  pullNumber,
  labels,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  pullNumber: number;
  labels: string[];
}): Promise<void> {
  if (labels.length === 0) {
    ctx.core.info("No labels to add");
    return;
  }

  ctx.core.info(`Adding labels to PR #${pullNumber}: ${labels.join(", ")}`);

  await ctx.github.rest.issues.addLabels({
    ...repo,
    issue_number: pullNumber,
    labels,
  });
}

/**
 * Removes labels from a pull request
 */
export async function removeLabelsFromPullRequest({
  ctx,
  repo,
  pullNumber,
  labels,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  pullNumber: number;
  labels: string[];
}): Promise<void> {
  if (labels.length === 0) {
    ctx.core.info("No labels to remove");
    return;
  }

  ctx.core.info(`Removing labels from PR #${pullNumber}: ${labels.join(", ")}`);

  // Remove each label individually
  for (const label of labels) {
    try {
      await ctx.github.rest.issues.removeLabel({
        ...repo,
        issue_number: pullNumber,
        name: label,
      });
    } catch (error: any) {
      // Ignore 404 errors (label not found on PR)
      if (error?.status === 404) {
        ctx.core.info(`Label '${label}' was not present on PR #${pullNumber}`);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Checks if a pull request has specific labels
 */
export async function pullRequestHasLabels({
  ctx,
  repo,
  pullNumber,
  labels,
  requireAll = true,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  pullNumber: number;
  labels: string[];
  requireAll?: boolean; // If true, PR must have ALL labels; if false, just ANY label
}): Promise<boolean> {
  const pr = await getPullRequest({ ctx, repo, pullNumber });
  const prLabels = pr.labels.map((label) => label.name);

  if (requireAll) {
    return labels.every((label) => prLabels.includes(label));
  } else {
    return labels.some((label) => prLabels.includes(label));
  }
}

/**
 * Gets the files changed in a pull request
 */
export async function getPullRequestFiles({
  ctx,
  repo,
  pullNumber,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  pullNumber: number;
}): Promise<
  Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>
> {
  ctx.core.info(`Getting files for PR #${pullNumber}`);

  const { data: files } = await ctx.github.rest.pulls.listFiles({
    ...repo,
    pull_number: pullNumber,
    per_page: 100,
  });

  return files.map((file) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    ...(file.patch && { patch: file.patch }),
  }));
}
