import type { GitHubContext, RepoInfo } from "./types.js";

/**
 * Checks if a branch exists in the repository
 */
export async function checkBranchExists({
  ctx,
  repo,
  branch,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  branch: string;
}): Promise<boolean> {
  try {
    await ctx.github.rest.repos.getBranch({
      ...repo,
      branch,
    });
    return true;
  } catch (error: any) {
    if (error?.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Lists all branches in the repository
 */
export async function listAllBranches({
  ctx,
  repo,
  limit = 100,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  limit?: number;
}): Promise<string[]> {
  const branches: string[] = [];
  let page = 1;
  const perPage = Math.min(limit, 100);

  while (branches.length < limit) {
    const { data } = await ctx.github.rest.repos.listBranches({
      ...repo,
      per_page: perPage,
      page,
    });

    if (data.length === 0) {
      break;
    }

    branches.push(...data.map((branch) => branch.name));

    if (data.length < perPage) {
      break; // No more pages
    }

    page++;
  }

  return branches.slice(0, limit);
}

/**
 * Gets branch protection rules for a branch
 */
export async function getBranchProtection({
  ctx,
  repo,
  branch,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  branch: string;
}) {
  try {
    const { data } = await ctx.github.rest.repos.getBranchProtection({
      ...repo,
      branch,
    });
    return data;
  } catch (error: any) {
    if (error?.status === 404) {
      return null; // No protection rules
    }
    throw error;
  }
}

/**
 * Gets the default branch of the repository
 */
export async function getDefaultBranch({
  ctx,
  repo,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
}): Promise<string> {
  const { data } = await ctx.github.rest.repos.get(repo);
  return data.default_branch;
}
