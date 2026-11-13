import assert from 'node:assert/strict';
import { findCommentByIdentifier, sanitizeInput } from 'github-typescript-utils';

assert.equal(sanitizeInput('"release"'), 'release');
const pages = [];
const firstPage = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1,
  body: 'Ordinary comment',
}));
const ctx = {
  github: {
    rest: {
      issues: {
        async listComments({ page, per_page }) {
          assert.equal(per_page, 100);
          pages.push(page);
          return {
            data:
              page === 1 ? firstPage : [{ id: 501, body: '<!-- sticky-comment-id: release -->' }],
          };
        },
      },
    },
  },
};
assert.deepEqual(
  await findCommentByIdentifier({
    ctx,
    repo: { owner: 'owner', repo: 'repo' },
    issueNumber: 7,
    identifier: 'release',
  }),
  { id: 501, body: '<!-- sticky-comment-id: release -->' }
);
assert.deepEqual(pages, [1, 2]);
console.log(`Packed public-root import and behavior passed on ${process.version}`);
