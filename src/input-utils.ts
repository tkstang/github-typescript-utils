import type { GitHubContext } from './types.js';

/**
 * Sanitizes input by removing leading and trailing quotes.
 * This is useful as inputs may have extra quotes added by steps in the workflow.
 */
export function sanitizeInput(input: string): string;
export function sanitizeInput(input: unknown): unknown;
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    return input.replace(/^"|"$/g, '');
  }
  return input;
}

/**
 * Sanitizes all string values in an input object by removing leading and trailing quotes.
 * This is useful as inputs may have extra quotes added by steps in the workflow.
 */
export function sanitizeInputs<T extends Record<string, unknown>>(obj: T): T {
  const sanitizedObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitizedObj[key] = value.replace(/^"|"$/g, '');
    } else {
      sanitizedObj[key] = value;
    }
  }
  return sanitizedObj as T;
}

/**
 * Extracts the branch name from various GitHub event types
 */
export function getBranch(ctx: GitHubContext): string {
  const { context } = ctx;
  const { payload, eventName, ref } = context;

  // Try to get branch from event-specific payload
  const eventData = payload[eventName as keyof typeof payload];
  const branchFromEvent = eventData?.head?.ref;

  if (branchFromEvent) {
    return branchFromEvent;
  }

  // Fall back to ref, removing refs/heads/ prefix
  if (ref?.startsWith('refs/heads/')) {
    return ref.replace('refs/heads/', '');
  }

  // Last resort: try common payload locations
  if (payload.pull_request?.head?.ref) {
    return payload.pull_request.head.ref;
  }

  if (payload.push?.ref) {
    return payload.push.ref.replace('refs/heads/', '');
  }

  return ref || 'main';
}
