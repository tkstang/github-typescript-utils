import type * as core from '@actions/core';
import type { getOctokit } from '@actions/github';

/**
 * Core context types provided by github-typescript wrapper
 */
export type GitHubContext = {
  core: typeof core;
  github: ReturnType<typeof getOctokit>;
  context: typeof import('@actions/github').context;
};

/**
 * Repository identification
 */
export type RepoInfo = {
  owner: string;
  repo: string;
};

/**
 * Common comment structure from GitHub API
 */
export type Comment = {
  id: number;
  body: string;
  user: {
    login: string;
    id: number;
  } | null;
  created_at: string;
  updated_at: string;
  html_url: string;
};

/**
 * Issue comment structure
 */
export type IssueComment = Comment & {
  issue_url: string;
};

/**
 * Pull request comment structure (review comments)
 */
export type PullRequestComment = Comment & {
  pull_request_review_id: number;
  diff_hunk: string;
  path: string;
  position: number | null;
  original_position: number;
  commit_id: string;
  original_commit_id: string;
  in_reply_to_id?: number;
  pull_request_url: string;
};

/**
 * Pull request structure with common fields
 */
export type PullRequest = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  draft: boolean;
  user: {
    login: string;
    id: number;
  } | null;
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
  }>;
  head: {
    ref: string;
    sha: string;
    repo: {
      name: string;
      owner: {
        login: string;
      };
    } | null;
  };
  base: {
    ref: string;
    sha: string;
    repo: {
      name: string;
      owner: {
        login: string;
      };
    };
  };
  html_url: string;
  created_at: string;
  updated_at: string;
};

/**
 * Options for sticky comment functionality
 */
export type StickyCommentOptions = {
  /**
   * Unique identifier for the sticky comment (used to find and update existing comments)
   */
  identifier: string;
  /**
   * Comment body content (supports markdown)
   */
  body: string;
  /**
   * Whether to update existing comment or create new if not found
   * @default true
   */
  updateIfExists?: boolean;
};

/**
 * Search options for finding comments
 */
export type CommentSearchOptions = {
  /**
   * Search for comments containing this text
   */
  bodyContains?: string;
  /**
   * Search for comments by specific user
   */
  author?: string;
  /**
   * Search for comments created after this date
   */
  createdAfter?: Date;
  /**
   * Search for comments created before this date
   */
  createdBefore?: Date;
  /**
   * Maximum number of comments to return
   * @default 100
   */
  limit?: number;
};

/**
 * Options for finding pull requests by label
 */
export type PullRequestSearchOptions = {
  /**
   * Labels that must be present on the PR (AND logic)
   */
  labels: string[];
  /**
   * PR state to filter by
   * @default 'open'
   */
  state?: 'open' | 'closed' | 'all';
  /**
   * Maximum number of PRs to return
   * @default 30
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
};
