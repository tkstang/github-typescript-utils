# github-typescript-utils

**Utility functions for GitHub REST API interactions with [`github-typescript`](https://github.com/tkstang/github-typescript).**

This package provides a comprehensive set of TypeScript utilities for interacting with the GitHub REST API within GitHub Actions workflows. Designed specifically for use with the `github-typescript` composite action, these utilities simplify common GitHub operations like managing comments, pull requests, and repository interactions.

## Features

### 📋 Complete Function Reference

| Category                  | Functions                                                                                                                                                                                                    | Description                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **💬 Comments**           | `createStickyComment`, `findCommentByIdentifier`, `searchComments`, `deleteComment`, `deleteStickyComment`                                                                                                   | Create, find, search, and manage issue/PR comments                  |
| **🔀 Pull Requests**      | `findPullRequestsByLabels`, `getPullRequest`, `addLabelsToPullRequest`, `removeLabelsFromPullRequest`, `pullRequestHasLabels`, `getPullRequestFiles`                                                         | Find, manage, and interact with pull requests                       |
| **🔍 Advanced PR Search** | `findPRsWithLabels`, `searchPullRequests`, `findOpenPRsWithLabel`, `checkLabelConflicts`                                                                                                                     | Advanced pull request search and label conflict detection           |
| **🌿 Branch Management**  | `checkBranchExists`, `listAllBranches`, `getBranchProtection`, `getDefaultBranch`                                                                                                                            | Branch existence, listing, and protection management                |
| **🚀 Deployments**        | `listDeployments`, `getDeploymentStatuses`, `setDeploymentStatus`, `deleteDeployment`, `createDeployment`                                                                                                    | Deployment lifecycle management                                     |
| **🔧 Context & Utils**    | `getRepoInfo`, `getCurrentPullRequestNumber`, `getCurrentIssueNumber`, `isPullRequestContext`, `isIssueContext`, `getCurrentSHA`, `getCurrentBranch`, `getRepositoryUrl`, `getIssueUrl`, `getPullRequestUrl` | GitHub Actions context extraction and URL helpers                   |
| **📝 Text & Formatting**  | `escapeMarkdown`, `codeBlock`, `createMarkdownTable`, `truncateText`, `formatDate`, `parseGitHubDate`, `delay`                                                                                               | Text formatting, markdown utilities, and date handling              |
| **🔤 String Utilities**   | `snakeToCamel`, `camelToSnake`, `kebabToCamel`, `camelToKebab`, `capitalize`, `toTitleCase`                                                                                                                  | String case conversion and text transformation                      |
| **⚙️ Input Processing**   | `sanitizeInput`, `sanitizeInputs`, `getBranch`                                                                                                                                                               | Input sanitization and branch extraction from various GitHub events |

### ✨ Key Features

- ✅ **Type Safety** - Full TypeScript support with comprehensive type definitions
- ✅ **Universal Compatibility** - Works with all GitHub event types and contexts
- ✅ **Comprehensive Testing** - 110+ tests with 94%+ code coverage
- ✅ **GitHub API Optimized** - Efficient API usage with proper error handling and pagination support
- ✅ **Developer Friendly** - Intuitive APIs with TypeScript intellisense and JSDoc documentation

---

## Installation

```bash
# With pnpm (recommended)
pnpm add github-typescript-utils

# With npm
npm install github-typescript-utils

# With yarn
yarn add github-typescript-utils
```

**Peer Dependencies:**

- `@actions/core` (^1.10.0)
- `@actions/github` (^6.0.0)

---

## Usage with github-typescript

Create a TypeScript script that imports the utilities:

```ts
// .github/scripts/manage-pr.ts
import {
  createStickyComment,
  findPullRequestsByLabels,
  getRepoInfo,
  getCurrentPullRequestNumber,
  type GitHubContext,
} from "github-typescript-utils";

type Args = {
  message: string;
  labels: string[];
};

export default async function run({
  core,
  github,
  context,
  args,
}: GitHubContext & { args: Args }) {
  const repo = getRepoInfo({ core, github, context });
  const prNumber = getCurrentPullRequestNumber({ core, github, context });

  if (!prNumber) {
    core.setFailed("This action must run on a pull request");
    return;
  }

  // Create a sticky comment
  await createStickyComment({
    ctx: { core, github, context },
    repo,
    issueNumber: prNumber,
    options: {
      identifier: "status-update",
      body: `## PR Status\n\n${args.message}`,
    },
  });

  // Find PRs with specific labels
  const prs = await findPullRequestsByLabels({
    ctx: { core, github, context },
    repo,
    options: { labels: args.labels },
  });

  core.info(`Found ${prs.length} PRs with labels: ${args.labels.join(", ")}`);
  return { success: true, prCount: prs.length };
}
```

Use in your workflow:

```yaml
- name: Manage PR
  uses: tkstang/github-typescript@v1
  with:
    ts-file: .github/scripts/manage-pr.ts
    args: ${{ toJson({ message: 'Build completed!', labels: ['ready-for-review'] }) }}
```

---

## API Reference

### Comments

#### `createStickyComment(options)`

Creates or updates a "sticky" comment that can be updated in subsequent runs rather than creating duplicates.

```ts
await createStickyComment({
  ctx: { core, github, context },
  repo: { owner: "tkstang", repo: "my-repo" },
  issueNumber: 123,
  options: {
    identifier: "build-status",
    body: "✅ Build completed successfully!",
    updateIfExists: true, // default: true
  },
});
```

#### `searchComments(options)`

Search for comments based on various criteria:

```ts
const comments = await searchComments({
  ctx: { core, github, context },
  repo,
  issueNumber: 123,
  options: {
    bodyContains: "error",
    author: "dependabot[bot]",
    createdAfter: new Date("2024-01-01"),
    limit: 10,
  },
});
```

#### `deleteComment(options)` / `deleteStickyComment(options)`

Remove comments by ID or sticky identifier:

```ts
// Delete by ID
await deleteComment({
  ctx: { core, github, context },
  repo,
  commentId: 456789,
});

// Delete sticky comment
await deleteStickyComment({
  ctx: { core, github, context },
  repo,
  issueNumber: 123,
  identifier: "build-status",
});
```

### Pull Requests

#### `findPullRequestsByLabels(options)`

Find pull requests that have all specified labels:

```ts
const prs = await findPullRequestsByLabels({
  ctx: { core, github, context },
  repo,
  options: {
    labels: ["bug", "ready-for-review"],
    state: "open", // 'open' | 'closed' | 'all'
    limit: 20,
  },
});
```

#### `addLabelsToPullRequest(options)` / `removeLabelsFromPullRequest(options)`

Manage PR labels:

```ts
await addLabelsToPullRequest({
  ctx: { core, github, context },
  repo,
  pullNumber: 123,
  labels: ["approved", "ready-to-merge"],
});

await removeLabelsFromPullRequest({
  ctx: { core, github, context },
  repo,
  pullNumber: 123,
  labels: ["work-in-progress"],
});
```

#### `getPullRequestFiles(options)`

Get the list of files changed in a PR:

```ts
const files = await getPullRequestFiles({
  ctx: { core, github, context },
  repo,
  pullNumber: 123,
});

console.log(
  files.map((f) => `${f.filename} (+${f.additions}/-${f.deletions})`)
);
```

### Context Utilities

#### Repository and Context Information

```ts
// Get repository info from context
const repo = getRepoInfo({ core, github, context });
// Returns: { owner: 'tkstang', repo: 'my-repo' }

// Get current PR/issue number
const prNumber = getCurrentPullRequestNumber({ core, github, context });
const issueNumber = getCurrentIssueNumber({ core, github, context });

// Check context type
const isPR = isPullRequestContext({ core, github, context });
const isIssue = isIssueContext({ core, github, context });

// Get commit/branch info
const sha = getCurrentSHA({ core, github, context });
const branch = getCurrentBranch({ core, github, context });
```

#### URL Helpers

```ts
const repoUrl = getRepositoryUrl({ core, github, context });
const prUrl = getPullRequestUrl({ core, github, context }, 123);
const issueUrl = getIssueUrl({ core, github, context }, 456);
```

### Markdown Utilities

#### Text Formatting

```ts
import {
  escapeMarkdown,
  codeBlock,
  createMarkdownTable,
  truncateText,
} from "github-typescript-utils";

// Escape special markdown characters
const safe = escapeMarkdown("Text with *special* characters");

// Create code blocks
const code = codeBlock('console.log("hello");', "javascript");

// Create tables
const table = createMarkdownTable(
  ["File", "Status", "Changes"],
  [
    ["src/index.ts", "✅", "+15/-3"],
    ["README.md", "📝", "+2/-0"],
  ]
);

// Truncate long text
const short = truncateText("Very long text...", 50);
```

### String Utilities

#### Case Conversion

```ts
import {
  snakeToCamel,
  camelToSnake,
  kebabToCamel,
  camelToKebab,
  capitalize,
  toTitleCase,
} from "github-typescript-utils";

// Convert between naming conventions
const camelCase = snakeToCamel("hello_world"); // "helloWorld"
const snakeCase = camelToSnake("helloWorld"); // "hello_world"
const kebabCase = camelToKebab("helloWorld"); // "hello-world"
const camelFromKebab = kebabToCamel("hello-world"); // "helloWorld"

// Text transformation
const capitalized = capitalize("hello"); // "Hello"
const titleCase = toTitleCase("hello world"); // "Hello World"
```

### Branch Management

#### Branch Operations

```ts
import {
  checkBranchExists,
  listAllBranches,
  getBranchProtection,
  getDefaultBranch,
} from "github-typescript-utils";

// Check if branch exists
const exists = await checkBranchExists({
  ctx: { core, github, context },
  repo,
  branch: "feature-branch",
});

// List all branches
const branches = await listAllBranches({
  ctx: { core, github, context },
  repo,
  limit: 50,
});

// Get branch protection rules
const protection = await getBranchProtection({
  ctx: { core, github, context },
  repo,
  branch: "main",
});

// Get default branch
const defaultBranch = await getDefaultBranch({
  ctx: { core, github, context },
  repo,
});
```

### Deployment Management

#### Deployment Lifecycle

```ts
import {
  listDeployments,
  createDeployment,
  setDeploymentStatus,
  getDeploymentStatuses,
  deleteDeployment,
} from "github-typescript-utils";

// Create a deployment
const deployment = await createDeployment({
  ctx: { core, github, context },
  repo,
  ref: "main",
  environment: "production",
  description: "Deploy v1.0.0",
});

// Set deployment status
await setDeploymentStatus({
  ctx: { core, github, context },
  repo,
  deploymentId: deployment.id,
  state: "success",
  description: "Deployment completed successfully",
});

// List deployments
const deployments = await listDeployments({
  ctx: { core, github, context },
  repo,
  environment: "production",
});
```

### Advanced PR Search

#### Enhanced PR Operations

```ts
import {
  findPRsWithLabels,
  searchPullRequests,
  checkLabelConflicts,
  findOpenPRsWithLabel,
} from "github-typescript-utils";

// Find PRs with multiple labels
const prs = await findPRsWithLabels({
  ctx: { core, github, context },
  repo,
  labels: ["bug", "urgent"],
  excludePRs: [123], // Exclude specific PR numbers
});

// Advanced PR search
const searchResults = await searchPullRequests({
  ctx: { core, github, context },
  repo,
  options: {
    labels: ["feature"],
    author: "dependabot[bot]",
    state: "open",
  },
});

// Check for label conflicts
const conflict = await checkLabelConflicts({
  ctx: { core, github, context },
  repo,
  prNumber: 123,
  label: "sync-branch: main",
});

if (conflict.hasConflict) {
  core.warning(`Label conflict with PR #${conflict.conflictingPR?.number}`);
}
```

### Input Processing

#### Input Sanitization and Branch Extraction

```ts
import {
  sanitizeInput,
  sanitizeInputs,
  getBranch,
} from "github-typescript-utils";

// Remove quotes from workflow inputs
const cleanInput = sanitizeInput('"quoted-value"'); // "quoted-value"

// Sanitize all string properties in an object
const cleanInputs = sanitizeInputs({
  name: '"John"',
  age: 30,
  title: '"Developer"',
}); // { name: "John", age: 30, title: "Developer" }

// Extract branch from any GitHub event
const branch = getBranch({ core, github, context });
// Works with: pull_request, push, workflow_run, etc.
```

---

## Type Definitions

The package exports comprehensive TypeScript types:

```ts
import type {
  // Core types
  GitHubContext,
  RepoInfo,
  PullRequest,
  IssueComment,

  // Comment types
  StickyCommentOptions,
  CommentSearchOptions,

  // Pull request types
  PullRequestSearchOptions,
  PullRequestFile,
  AdvancedPRSearchOptions,

  // Deployment types
  Deployment,
  DeploymentStatus,
} from "github-typescript-utils";
```

---

## Examples

### Build Status Updater

```ts
// .github/scripts/update-build-status.ts
import {
  createStickyComment,
  getRepoInfo,
  getCurrentPullRequestNumber,
} from "github-typescript-utils";

export default async function run({ core, github, context, args }) {
  const repo = getRepoInfo({ core, github, context });
  const prNumber = getCurrentPullRequestNumber({ core, github, context });

  if (!prNumber) return { skipped: true };

  const status = args.success ? "✅ Passed" : "❌ Failed";
  const details = args.details || "";

  await createStickyComment({
    ctx: { core, github, context },
    repo,
    issueNumber: prNumber,
    options: {
      identifier: "ci-status",
      body: `## 🚀 CI Status\n\n${status}\n\n${details}`,
    },
  });

  return { updated: true };
}
```

### PR Triage Bot

```ts
// .github/scripts/triage-prs.ts
import {
  findPullRequestsByLabels,
  addLabelsToPullRequest,
  getRepoInfo,
} from "github-typescript-utils";

export default async function run({ core, github, context }) {
  const repo = getRepoInfo({ core, github, context });

  // Find stale PRs
  const stalePRs = await findPullRequestsByLabels({
    ctx: { core, github, context },
    repo,
    options: {
      labels: ["needs-review"],
      state: "open",
      sort: "updated",
      direction: "asc",
      limit: 10,
    },
  });

  // Label old PRs as stale
  for (const pr of stalePRs) {
    const daysSinceUpdate =
      (Date.now() - new Date(pr.updated_at).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 7) {
      await addLabelsToPullRequest({
        ctx: { core, github, context },
        repo,
        pullNumber: pr.number,
        labels: ["stale"],
      });

      core.info(
        `Labeled PR #${pr.number} as stale (${Math.round(
          daysSinceUpdate
        )} days old)`
      );
    }
  }

  return { processed: stalePRs.length };
}
```

---

## Contributing

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Make changes to `src/` files
4. Build: `pnpm run build`
5. Test your changes
6. Submit a pull request

## License

MIT - see [LICENSE](LICENSE) file for details.
