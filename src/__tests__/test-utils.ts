import { vi } from 'vitest';
import type { GitHubContext } from '../types.js';

const defaultCore = {
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  notice: vi.fn(),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  isDebug: vi.fn().mockReturnValue(false),
  exportVariable: vi.fn(),
  setSecret: vi.fn(),
  addPath: vi.fn(),
  getInput: vi.fn(),
  getMultilineInput: vi.fn(),
  getBooleanInput: vi.fn(),
  setCommandEcho: vi.fn(),
  saveState: vi.fn(),
  getState: vi.fn(),
  getIDToken: vi.fn(),
  summary: {
    addRaw: vi.fn(),
    addCodeBlock: vi.fn(),
    addList: vi.fn(),
    addTable: vi.fn(),
    addDetails: vi.fn(),
    addImage: vi.fn(),
    addHeading: vi.fn(),
    addSeparator: vi.fn(),
    addBreak: vi.fn(),
    addQuote: vi.fn(),
    addLink: vi.fn(),
    clear: vi.fn(),
    stringify: vi.fn(),
    isEmptyBuffer: vi.fn(),
    emptyBuffer: vi.fn(),
    write: vi.fn(),
  },
  markdownSummary: vi.fn(),
  group: vi.fn(),
  startGroup: vi.fn(),
  endGroup: vi.fn(),
};

const defaultGithub = {
  rest: {
    issues: {
      createComment: vi.fn(),
      updateComment: vi.fn(),
      deleteComment: vi.fn(),
      listComments: vi.fn(),
      addLabels: vi.fn(),
      removeLabel: vi.fn(),
    },
    pulls: {
      list: vi.fn(),
      get: vi.fn(),
      listFiles: vi.fn(),
    },
    repos: {
      listBranches: vi.fn(),
      getBranch: vi.fn(),
      getBranchProtection: vi.fn(),
      get: vi.fn(),
      listDeployments: vi.fn(),
      createDeployment: vi.fn(),
      deleteDeployment: vi.fn(),
      listDeploymentStatuses: vi.fn(),
      createDeploymentStatus: vi.fn(),
    },
    search: {
      issuesAndPullRequests: vi.fn(),
    },
  },
  graphql: vi.fn(),
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  hook: {
    before: vi.fn(),
    after: vi.fn(),
    error: vi.fn(),
    wrap: vi.fn(),
  },
  auth: vi.fn(),
  request: vi.fn(),
  paginate: vi.fn(),
};

/**
 * Creates a properly typed mock GitHubContext for testing
 */
export function createMockGitHubContext(overrides: Partial<GitHubContext> = {}): GitHubContext {
  const defaultContext: GitHubContext['context'] = {
    eventName: 'push',
    ref: 'refs/heads/main',
    sha: 'abc123',
    workflow: 'test',
    action: 'test',
    actor: 'test-user',
    job: 'test-job',
    runNumber: 1,
    runId: 1,
    runAttempt: 1,
    apiUrl: 'https://api.github.com',
    serverUrl: 'https://github.com',
    graphqlUrl: 'https://api.github.com/graphql',
    repo: { owner: 'test', repo: 'test-repo' },
    issue: { owner: 'test', repo: 'test-repo', number: 1 },
    payload: {},
  };

  return {
    core: defaultCore,
    github: defaultGithub,
    context: defaultContext,
    ...overrides,
  } as unknown as GitHubContext;
}

/**
 * Creates a mock context for getBranch function tests
 */
export function createMockContext(
  overrides: Partial<GitHubContext['context']> = {}
): GitHubContext['context'] {
  return {
    eventName: 'push',
    ref: 'refs/heads/main',
    sha: 'abc123',
    workflow: 'test',
    action: 'test',
    actor: 'test-user',
    job: 'test-job',
    runNumber: 1,
    runId: 1,
    runAttempt: 1,
    apiUrl: 'https://api.github.com',
    serverUrl: 'https://github.com',
    graphqlUrl: 'https://api.github.com/graphql',
    repo: { owner: 'test', repo: 'test-repo' },
    issue: { owner: 'test', repo: 'test-repo', number: 1 },
    payload: {},
    ...overrides,
  };
}

/**
 * Creates a simple mock GitHubContext with custom github.rest methods
 * This is a simpler alternative when you just need to mock specific API calls
 */
export function createSimpleMockContext(mockGithub: Record<string, unknown> = {}): GitHubContext {
  // Use the existing defaultCore and defaultGithub but override with mockGithub
  const core = { ...defaultCore };
  const github = {
    ...defaultGithub,
    rest: {
      ...defaultGithub.rest,
      ...(mockGithub.rest || {}),
    },
  };

  return {
    core,
    github,
    context: {
      eventName: 'push',
      ref: 'refs/heads/main',
      sha: 'abc123',
      workflow: 'test',
      action: 'test',
      actor: 'test-user',
      job: 'test-job',
      runNumber: 1,
      runId: 1,
      runAttempt: 1,
      apiUrl: 'https://api.github.com',
      serverUrl: 'https://github.com',
      graphqlUrl: 'https://api.github.com/graphql',
      repo: { owner: 'test', repo: 'test-repo' },
      issue: { owner: 'test', repo: 'test-repo', number: 1 },
      payload: {},
    },
  } as unknown as GitHubContext;
}
