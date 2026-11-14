import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateReleaseTag } from './validate-tag.ts';

describe('release tag validation', () => {
  it('accepts an exact full stable version', () => {
    expect(() => validateReleaseTag('v1.2.3', '1.2.3')).not.toThrow();
  });

  it.each([undefined, 'v1', 'v1.2', '1.2.3', 'v01.2.3', 'v1.2.3-rc.1', 'v1.2.3+build', ' v1.2.3'])(
    'rejects a missing, partial or non-stable tag: %s',
    (tag) => {
      expect(() => validateReleaseTag(tag, '1.2.3')).toThrow('full stable version');
    }
  );

  it('rejects a full tag for a different package version', () => {
    expect(() => validateReleaseTag('v1.2.4', '1.2.3')).toThrow('does not match package version');
  });

  it('rejects a mismatched workflow tag through the executable CLI', () => {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL('./validate-tag.ts', import.meta.url))],
      { encoding: 'utf8', env: { ...process.env, RELEASE_TAG: 'v0.0.0' } }
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('does not match package version');
  });
});
