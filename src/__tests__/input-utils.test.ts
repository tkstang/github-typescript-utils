import { describe, expect, it } from 'vitest';
import { getBranch, sanitizeInput, sanitizeInputs } from '../input-utils.js';
import { createMockContext, createMockGitHubContext } from './test-utils.js';

describe('sanitizeInput', () => {
  it('should remove leading and trailing quotes from strings', () => {
    expect(sanitizeInput('"hello"')).toBe('hello');
    expect(sanitizeInput("'world'")).toBe("'world'"); // Only removes double quotes
    expect(sanitizeInput('""test""')).toBe('"test"'); // Only removes outer quotes
  });

  it('should return non-string values unchanged', () => {
    expect(sanitizeInput(123)).toBe(123);
    expect(sanitizeInput(true)).toBe(true);
    expect(sanitizeInput(null)).toBe(null);
    expect(sanitizeInput(undefined)).toBe(undefined);
    expect(sanitizeInput({ key: 'value' })).toEqual({ key: 'value' });
  });

  it('should handle strings without quotes', () => {
    expect(sanitizeInput('hello')).toBe('hello');
    expect(sanitizeInput('')).toBe('');
  });

  it('should handle edge cases with quotes', () => {
    expect(sanitizeInput('"')).toBe(''); // Single quote character gets removed
    expect(sanitizeInput('""')).toBe(''); // Empty quoted string
    expect(sanitizeInput('"a"')).toBe('a'); // Single character
    expect(sanitizeInput('"hello world"')).toBe('hello world'); // String with spaces
  });
});

describe('sanitizeInputs', () => {
  it('should sanitize all string values in an object', () => {
    const input = {
      name: '"John"',
      age: 30,
      active: true,
      description: '"A developer"',
    };

    const expected = {
      name: 'John',
      age: 30,
      active: true,
      description: 'A developer',
    };

    expect(sanitizeInputs(input)).toEqual(expected);
  });

  it('should handle empty objects', () => {
    expect(sanitizeInputs({})).toEqual({});
  });

  it('should handle objects with no string values', () => {
    const input = { count: 42, enabled: false };
    expect(sanitizeInputs(input)).toEqual(input);
  });

  it('should handle nested objects and arrays', () => {
    const input = {
      name: '"John"',
      config: { title: '"My App"', debug: true },
      tags: ['"tag1"', '"tag2"', 123],
    };

    // sanitizeInputs only handles top-level properties, not nested ones
    const expected = {
      name: 'John',
      config: { title: '"My App"', debug: true }, // nested objects not processed
      tags: ['"tag1"', '"tag2"', 123], // arrays not processed
    };

    expect(sanitizeInputs(input)).toEqual(expected);
  });

  it('should handle null and undefined values', () => {
    const input = {
      name: '"John"',
      value: null,
      optional: undefined,
    };

    const expected = {
      name: 'John',
      value: null,
      optional: undefined,
    };

    expect(sanitizeInputs(input)).toEqual(expected);
  });
});

describe('getBranch', () => {
  it('should extract branch from pull request context', () => {
    const ctx = createMockGitHubContext({
      context: createMockContext({
        eventName: 'pull_request',
        payload: {
          pull_request: {
            number: 123,
            head: {
              ref: 'feature-branch',
            },
          },
        },
      }),
    });

    expect(getBranch(ctx)).toBe('feature-branch');
  });

  it('should extract branch from push context', () => {
    const ctx = createMockGitHubContext({
      context: createMockContext({
        eventName: 'push',
        ref: 'refs/heads/develop',
        payload: {
          push: {
            ref: 'refs/heads/develop',
          },
        },
      }),
    });

    expect(getBranch(ctx)).toBe('develop');
  });

  it('should fall back to ref when event data is not available', () => {
    const ctx = createMockGitHubContext({
      context: createMockContext({
        eventName: 'workflow_dispatch',
        ref: 'refs/heads/main',
        payload: {},
      }),
    });

    expect(getBranch(ctx)).toBe('main');
  });

  it('should return default branch when no ref is available', () => {
    const ctx = createMockGitHubContext({
      context: createMockContext({
        eventName: 'schedule',
        ref: '',
        payload: {},
      }),
    });

    expect(getBranch(ctx)).toBe('main');
  });

  it('should handle pull request synchronize event', () => {
    const ctx = createMockGitHubContext({
      context: createMockContext({
        eventName: 'pull_request',
        payload: {
          action: 'synchronize',
          pull_request: {
            number: 456,
            head: {
              ref: 'sync-branch',
            },
          },
        },
      }),
    });

    expect(getBranch(ctx)).toBe('sync-branch');
  });

  it('should handle workflow_run event', () => {
    const ctx = createMockGitHubContext({
      context: createMockContext({
        eventName: 'workflow_run',
        ref: 'refs/heads/workflow-branch',
        payload: {
          workflow_run: {
            head_branch: 'workflow-branch',
          },
        },
      }),
    });

    expect(getBranch(ctx)).toBe('workflow-branch');
  });

  it('should handle tag refs', () => {
    const ctx = createMockGitHubContext({
      context: createMockContext({
        eventName: 'push',
        ref: 'refs/tags/v1.0.0',
        payload: {},
      }),
    });

    expect(getBranch(ctx)).toBe('refs/tags/v1.0.0');
  });
});
