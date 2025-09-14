import type { GitHubContext, RepoInfo } from './types.js';

/**
 * Extracts repository information from the GitHub context
 */
export function getRepoInfo(ctx: GitHubContext): RepoInfo {
  return {
    owner: ctx.context.repo.owner,
    repo: ctx.context.repo.repo,
  };
}

/**
 * Gets the current pull request number from the context (if available)
 */
export function getCurrentPullRequestNumber(ctx: GitHubContext): number | null {
  const prNumber = ctx.context.payload.pull_request?.number;
  return typeof prNumber === 'number' ? prNumber : null;
}

/**
 * Gets the current issue number from the context (if available)
 */
export function getCurrentIssueNumber(ctx: GitHubContext): number | null {
  // Check for issue or pull request (PRs are also issues in GitHub API)
  const issueNumber = ctx.context.payload.issue?.number || ctx.context.payload.pull_request?.number;
  return typeof issueNumber === 'number' ? issueNumber : null;
}

/**
 * Checks if the current context is a pull request
 */
export function isPullRequestContext(ctx: GitHubContext): boolean {
  return !!ctx.context.payload.pull_request;
}

/**
 * Checks if the current context is an issue (but not a PR)
 */
export function isIssueContext(ctx: GitHubContext): boolean {
  return !!ctx.context.payload.issue && !ctx.context.payload.pull_request;
}

/**
 * Gets the SHA of the current commit
 */
export function getCurrentSHA(ctx: GitHubContext): string {
  return ctx.context.payload.pull_request?.head.sha || ctx.context.payload.after || ctx.context.sha;
}

/**
 * Gets the current branch name
 */
export function getCurrentBranch(ctx: GitHubContext): string {
  // For pull requests, get the head branch
  if (ctx.context.payload.pull_request) {
    return ctx.context.payload.pull_request.head.ref;
  }

  // For push events, extract from ref
  if (ctx.context.ref.startsWith('refs/heads/')) {
    return ctx.context.ref.replace('refs/heads/', '');
  }

  return ctx.context.ref;
}

/**
 * Creates a GitHub API URL for the current repository
 */
export function getRepositoryUrl(ctx: GitHubContext): string {
  const { owner, repo } = getRepoInfo(ctx);
  return `https://github.com/${owner}/${repo}`;
}

/**
 * Creates a GitHub API URL for a specific issue or PR
 */
export function getIssueUrl(ctx: GitHubContext, issueNumber: number): string {
  const { owner, repo } = getRepoInfo(ctx);
  return `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
}

/**
 * Creates a GitHub API URL for a specific pull request
 */
export function getPullRequestUrl(ctx: GitHubContext, pullNumber: number): string {
  const { owner, repo } = getRepoInfo(ctx);
  return `https://github.com/${owner}/${repo}/pull/${pullNumber}`;
}

/**
 * Formats a date for use in GitHub API calls or comments
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Parses a GitHub date string into a Date object
 */
export function parseGitHubDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Delays execution for a specified number of milliseconds
 * Useful for rate limiting or adding delays between API calls
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncates text to a maximum length, adding ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Escapes markdown special characters in text
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&');
}

/**
 * Creates a markdown code block with optional language
 */
export function codeBlock(code: string, language?: string): string {
  const lang = language || '';
  return `\`\`\`${lang}\n${code}\n\`\`\``;
}

/**
 * Creates a markdown table from data
 */
export function createMarkdownTable(headers: string[], rows: string[][]): string {
  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map((row) => `| ${row.join(' | ')} |`);

  return [headerRow, separatorRow, ...dataRows].join('\n');
}
