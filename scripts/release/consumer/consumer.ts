import {
  findCommentByIdentifier,
  type GitHubContext,
  type IssueComment,
  sanitizeInput,
} from 'github-typescript-utils';

const normalized: string = sanitizeInput('"release"');
const lookup: (args: {
  ctx: GitHubContext;
  repo: { owner: string; repo: string };
  issueNumber: number;
  identifier: string;
}) => Promise<IssueComment | null> = findCommentByIdentifier;
void normalized;
void lookup;
