import { describe, expect, it, vi } from 'vitest';
import {
  createStickyComment,
  deleteComment,
  deleteStickyComment,
  findCommentByIdentifier,
  searchComments,
} from '../comments.js';
import { createSimpleMockContext } from './test-utils.js';

describe('createStickyComment', () => {
  it('should create a new sticky comment when none exists', async () => {
    const mockGithub = {
      rest: {
        issues: {
          listComments: vi.fn().mockResolvedValue({ data: [] }),
          createComment: vi.fn().mockResolvedValue({
            data: { id: 123, body: 'Test comment' },
          }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await createStickyComment({
      ctx,
      repo,
      issueNumber: 1,
      options: {
        identifier: 'test-sticky',
        body: 'Test comment',
      },
    });

    expect(result).toEqual({ id: 123, body: 'Test comment' });
    expect(mockGithub.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      issue_number: 1,
      body: '<!-- sticky-comment-id: test-sticky -->\nTest comment',
    });
  });

  it('should update existing sticky comment when updateIfExists is true', async () => {
    const existingComment = {
      id: 123,
      body: 'Old comment\n\n<!-- sticky-comment-id: test-sticky -->',
    };

    const mockGithub = {
      rest: {
        issues: {
          listComments: vi.fn().mockResolvedValue({ data: [existingComment] }),
          updateComment: vi.fn().mockResolvedValue({
            data: { id: 123, body: 'Updated comment' },
          }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await createStickyComment({
      ctx,
      repo,
      issueNumber: 1,
      options: {
        identifier: 'test-sticky',
        body: 'Updated comment',
        updateIfExists: true,
      },
    });

    expect(result).toEqual({ id: 123, body: 'Updated comment' });
    expect(mockGithub.rest.issues.updateComment).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      comment_id: 123,
      body: '<!-- sticky-comment-id: test-sticky -->\nUpdated comment',
    });
  });

  it('should create new comment when updateIfExists is false', async () => {
    const existingComment = {
      id: 123,
      body: 'Old comment\n\n<!-- sticky-comment-id: test-sticky -->',
    };

    const mockGithub = {
      rest: {
        issues: {
          listComments: vi.fn().mockResolvedValue({ data: [existingComment] }),
          createComment: vi.fn().mockResolvedValue({
            data: { id: 456, body: 'New comment' },
          }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await createStickyComment({
      ctx,
      repo,
      issueNumber: 1,
      options: {
        identifier: 'test-sticky',
        body: 'New comment',
        updateIfExists: false,
      },
    });

    expect(result).toEqual({ id: 456, body: 'New comment' });
    expect(mockGithub.rest.issues.createComment).toHaveBeenCalled();
  });
});

describe('findCommentByIdentifier', () => {
  it('should find existing sticky comment', async () => {
    const stickyComment = {
      id: 123,
      body: 'Test comment\n\n<!-- sticky-comment-id: test-sticky -->',
    };

    const mockGithub = {
      rest: {
        issues: {
          listComments: vi.fn().mockResolvedValue({
            data: [{ id: 456, body: 'Regular comment' }, stickyComment],
          }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await findCommentByIdentifier({
      ctx,
      repo,
      issueNumber: 1,
      identifier: 'test-sticky',
    });

    expect(result).toEqual(stickyComment);
  });

  it('should return null when sticky comment not found', async () => {
    const mockGithub = {
      rest: {
        issues: {
          listComments: vi.fn().mockResolvedValue({
            data: [{ id: 456, body: 'Regular comment' }],
          }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await findCommentByIdentifier({
      ctx,
      repo,
      issueNumber: 1,
      identifier: 'nonexistent',
    });

    expect(result).toBeNull();
  });
});

describe('searchComments', () => {
  it('should find comments matching criteria', async () => {
    const comments = [
      {
        id: 1,
        body: 'This contains error message',
        user: { login: 'alice' },
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 2,
        body: 'This is a regular comment',
        user: { login: 'bob' },
        created_at: '2024-01-16T10:00:00Z',
      },
      {
        id: 3,
        body: 'Another error occurred',
        user: { login: 'alice' },
        created_at: '2024-01-17T10:00:00Z',
      },
    ];

    const mockGithub = {
      rest: {
        issues: {
          listComments: vi
            .fn()
            .mockResolvedValueOnce({ data: comments })
            .mockResolvedValueOnce({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await searchComments({
      ctx,
      repo,
      issueNumber: 1,
      options: {
        bodyContains: 'error',
        author: 'alice',
      },
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(3);
  });

  it('should respect limit parameter', async () => {
    const comments = [
      { id: 1, body: 'Comment 1', user: { login: 'alice' } },
      { id: 2, body: 'Comment 2', user: { login: 'alice' } },
      { id: 3, body: 'Comment 3', user: { login: 'alice' } },
    ];

    const mockGithub = {
      rest: {
        issues: {
          listComments: vi.fn().mockResolvedValue({ data: comments }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await searchComments({
      ctx,
      repo,
      issueNumber: 1,
      options: {
        author: 'alice',
        limit: 2,
      },
    });

    expect(result).toHaveLength(2);
  });

  it('should filter by creation date', async () => {
    const comments = [
      {
        id: 1,
        body: 'Old comment',
        user: { login: 'alice' },
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: 2,
        body: 'New comment',
        user: { login: 'alice' },
        created_at: '2024-01-20T10:00:00Z',
      },
    ];

    const mockGithub = {
      rest: {
        issues: {
          listComments: vi.fn().mockResolvedValue({ data: comments }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await searchComments({
      ctx,
      repo,
      issueNumber: 1,
      options: {
        createdAfter: new Date('2024-01-15T00:00:00Z'),
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('should return empty array when no comments match', async () => {
    const mockGithub = {
      rest: {
        issues: {
          listComments: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await searchComments({
      ctx,
      repo,
      issueNumber: 1,
      options: {
        bodyContains: 'nonexistent',
      },
    });

    expect(result).toHaveLength(0);
  });

  it('should filter by creation date with createdBefore', async () => {
    const comments = [
      {
        id: 1,
        body: 'Old comment',
        user: { login: 'alice' },
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: 2,
        body: 'New comment',
        user: { login: 'alice' },
        created_at: '2024-01-20T10:00:00Z',
      },
    ];

    const mockGithub = {
      rest: {
        issues: {
          listComments: vi.fn().mockResolvedValue({ data: comments }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await searchComments({
      ctx,
      repo,
      issueNumber: 1,
      options: {
        createdBefore: new Date('2024-01-15T00:00:00Z'),
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('should handle pagination correctly', async () => {
    const firstPage = [
      { id: 1, body: 'Comment 1', user: { login: 'alice' } },
      { id: 2, body: 'Comment 2', user: { login: 'alice' } },
    ];
    const secondPage = [{ id: 3, body: 'Comment 3', user: { login: 'alice' } }];

    const mockGithub = {
      rest: {
        issues: {
          listComments: vi
            .fn()
            .mockResolvedValueOnce({ data: firstPage })
            .mockResolvedValueOnce({ data: secondPage })
            .mockResolvedValueOnce({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await searchComments({
      ctx,
      repo,
      issueNumber: 1,
      options: {},
    });

    // searchComments only makes one API call, not paginated
    expect(result).toHaveLength(2); // Only gets first page
    expect(mockGithub.rest.issues.listComments).toHaveBeenCalledTimes(1);
  });
});

describe('deleteComment', () => {
  it('should delete a comment by ID', async () => {
    const mockGithub = {
      rest: {
        issues: {
          deleteComment: vi.fn().mockResolvedValue({}),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    await deleteComment({
      ctx,
      repo,
      commentId: 123,
    });

    expect(mockGithub.rest.issues.deleteComment).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      comment_id: 123,
    });
    expect(ctx.core.info).toHaveBeenCalledWith('Deleting comment ID: 123');
  });
});

describe('deleteStickyComment', () => {
  it('should delete existing sticky comment and return true', async () => {
    const existingComment = {
      id: 123,
      body: 'Test comment\n\n<!-- sticky-comment-id: test-sticky -->',
    };

    const mockGithub = {
      rest: {
        issues: {
          listComments: vi.fn().mockResolvedValue({ data: [existingComment] }),
          deleteComment: vi.fn().mockResolvedValue({}),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await deleteStickyComment({
      ctx,
      repo,
      issueNumber: 1,
      identifier: 'test-sticky',
    });

    expect(result).toBe(true);
    expect(mockGithub.rest.issues.deleteComment).toHaveBeenCalledWith({
      owner: 'test',
      repo: 'test-repo',
      comment_id: 123,
    });
  });

  it('should return false when sticky comment not found', async () => {
    const mockGithub = {
      rest: {
        issues: {
          listComments: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    };

    const ctx = createSimpleMockContext(mockGithub);

    const repo = { owner: 'test', repo: 'test-repo' };
    const result = await deleteStickyComment({
      ctx,
      repo,
      issueNumber: 1,
      identifier: 'nonexistent',
    });

    expect(result).toBe(false);
    expect(ctx.core.info).toHaveBeenCalledWith(
      "Sticky comment with identifier 'nonexistent' not found"
    );
  });
});
