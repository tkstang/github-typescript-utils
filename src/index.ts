/**
 * GitHub TypeScript Utils
 *
 * Utility functions for GitHub REST API interactions, designed for use with
 * the github-typescript composite action.
 */

// Export all types
export type * from "./types.js";

// Export comment utilities
export {
  createStickyComment,
  findCommentByIdentifier,
  searchComments,
  deleteComment,
  deleteStickyComment,
} from "./comments.js";

// Export pull request utilities
export {
  findPullRequestsByLabels,
  getPullRequest,
  addLabelsToPullRequest,
  removeLabelsFromPullRequest,
  pullRequestHasLabels,
  getPullRequestFiles,
} from "./pull-requests.js";

// Export general utilities
export {
  getRepoInfo,
  getCurrentPullRequestNumber,
  getCurrentIssueNumber,
  isPullRequestContext,
  isIssueContext,
  getCurrentSHA,
  getCurrentBranch,
  getRepositoryUrl,
  getIssueUrl,
  getPullRequestUrl,
  formatDate,
  parseGitHubDate,
  delay,
  truncateText,
  escapeMarkdown,
  codeBlock,
  createMarkdownTable,
} from "./utils.js";
