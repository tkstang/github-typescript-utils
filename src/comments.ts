import type {
  GitHubContext,
  RepoInfo,
  IssueComment,
  StickyCommentOptions,
  CommentSearchOptions,
} from "./types.js";

/**
 * Creates or updates a "sticky" comment on an issue or pull request.
 * A sticky comment is identified by a unique identifier and will be updated
 * if it already exists, rather than creating duplicate comments.
 */
export async function createStickyComment({
  ctx,
  repo,
  issueNumber,
  options,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  issueNumber: number;
  options: StickyCommentOptions;
}): Promise<IssueComment> {
  const { identifier, body, updateIfExists = true } = options;

  // Create a comment identifier marker that's hidden in HTML but searchable
  const identifierMarker = `<!-- sticky-comment-id: ${identifier} -->`;
  const fullBody = `${identifierMarker}\n${body}`;

  // First, try to find existing sticky comment
  if (updateIfExists) {
    const existingComment = await findCommentByIdentifier({
      ctx,
      repo,
      issueNumber,
      identifier,
    });

    if (existingComment) {
      ctx.core.info(
        `Updating existing sticky comment ${identifier} (ID: ${existingComment.id})`
      );

      const { data: updatedComment } =
        await ctx.github.rest.issues.updateComment({
          ...repo,
          comment_id: existingComment.id,
          body: fullBody,
        });

      return updatedComment as IssueComment;
    }
  }

  // Create new comment
  ctx.core.info(`Creating new sticky comment with identifier: ${identifier}`);
  const { data: newComment } = await ctx.github.rest.issues.createComment({
    ...repo,
    issue_number: issueNumber,
    body: fullBody,
  });

  return newComment as IssueComment;
}

/**
 * Finds a sticky comment by its identifier
 */
export async function findCommentByIdentifier({
  ctx,
  repo,
  issueNumber,
  identifier,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  issueNumber: number;
  identifier: string;
}): Promise<IssueComment | null> {
  const identifierMarker = `<!-- sticky-comment-id: ${identifier} -->`;

  // Get all comments for the issue/PR
  const { data: comments } = await ctx.github.rest.issues.listComments({
    ...repo,
    issue_number: issueNumber,
    per_page: 100,
  });

  // Find comment containing our identifier
  const matchingComment = comments.find((comment: any) =>
    comment.body?.includes(identifierMarker)
  );

  return (matchingComment as IssueComment) || null;
}

/**
 * Searches for comments on an issue or pull request based on criteria
 */
export async function searchComments({
  ctx,
  repo,
  issueNumber,
  options,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  issueNumber: number;
  options: CommentSearchOptions;
}): Promise<IssueComment[]> {
  const {
    bodyContains,
    author,
    createdAfter,
    createdBefore,
    limit = 100,
  } = options;

  const { data: allComments } = await ctx.github.rest.issues.listComments({
    ...repo,
    issue_number: issueNumber,
    per_page: Math.min(limit, 100),
  });

  let filteredComments = allComments as IssueComment[];

  // Filter by body content
  if (bodyContains) {
    filteredComments = filteredComments.filter((comment) =>
      comment.body?.toLowerCase().includes(bodyContains.toLowerCase())
    );
  }

  // Filter by author
  if (author) {
    filteredComments = filteredComments.filter(
      (comment) => comment.user?.login === author
    );
  }

  // Filter by creation date
  if (createdAfter) {
    filteredComments = filteredComments.filter(
      (comment) => new Date(comment.created_at) > createdAfter
    );
  }

  if (createdBefore) {
    filteredComments = filteredComments.filter(
      (comment) => new Date(comment.created_at) < createdBefore
    );
  }

  return filteredComments.slice(0, limit);
}

/**
 * Deletes a comment by its ID
 */
export async function deleteComment({
  ctx,
  repo,
  commentId,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  commentId: number;
}): Promise<void> {
  ctx.core.info(`Deleting comment ID: ${commentId}`);
  await ctx.github.rest.issues.deleteComment({
    ...repo,
    comment_id: commentId,
  });
}

/**
 * Deletes a sticky comment by its identifier
 */
export async function deleteStickyComment({
  ctx,
  repo,
  issueNumber,
  identifier,
}: {
  ctx: GitHubContext;
  repo: RepoInfo;
  issueNumber: number;
  identifier: string;
}): Promise<boolean> {
  const existingComment = await findCommentByIdentifier({
    ctx,
    repo,
    issueNumber,
    identifier,
  });

  if (existingComment) {
    await deleteComment({ ctx, repo, commentId: existingComment.id });
    return true;
  }

  ctx.core.info(`Sticky comment with identifier '${identifier}' not found`);
  return false;
}
