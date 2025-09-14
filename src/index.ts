/**
 * GitHub TypeScript Utils
 *
 * Utility functions for GitHub REST API interactions, designed for use with
 * the github-typescript composite action.
 */

// Export advanced PR utilities
export {
  type AdvancedPRSearchOptions,
  checkLabelConflicts,
  findOpenPRsWithLabel,
  findPRsWithLabels,
  searchPullRequests,
} from './advanced-pr-utils.js';
// Export branch utilities
export {
  checkBranchExists,
  getBranchProtection,
  getDefaultBranch,
  listAllBranches,
} from './branch-utils.js';
// Export comment utilities
export {
  createStickyComment,
  deleteComment,
  deleteStickyComment,
  findCommentByIdentifier,
  searchComments,
} from './comments.js';
// Export deployment utilities
export {
  createDeployment,
  type Deployment,
  type DeploymentStatus,
  deleteDeployment,
  getDeploymentStatuses,
  listDeployments,
  setDeploymentStatus,
} from './deployment-utils.js';

// Export input utilities
export { getBranch, sanitizeInput, sanitizeInputs } from './input-utils.js';
// Export pull request utilities
export {
  addLabelsToPullRequest,
  findPullRequestsByLabels,
  getPullRequest,
  getPullRequestFiles,
  pullRequestHasLabels,
  removeLabelsFromPullRequest,
} from './pull-requests.js';
// Export string utilities
export {
  camelToKebab,
  camelToSnake,
  capitalize,
  kebabToCamel,
  snakeToCamel,
  toTitleCase,
} from './string-utils.js';
// Export all types
export type * from './types.js';
// Export general utilities
export {
  codeBlock,
  createMarkdownTable,
  delay,
  escapeMarkdown,
  formatDate,
  getCurrentBranch,
  getCurrentIssueNumber,
  getCurrentPullRequestNumber,
  getCurrentSHA,
  getIssueUrl,
  getPullRequestUrl,
  getRepoInfo,
  getRepositoryUrl,
  isIssueContext,
  isPullRequestContext,
  parseGitHubDate,
  truncateText,
} from './utils.js';
