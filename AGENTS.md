# github-typescript-utils

ESM utilities for GitHub Actions, supporting Node >=20. Development uses current
Node 22 from `.nvmrc` and pnpm 10.13.1 from `packageManager`. Preserve helper
signatures, marker matching, branch behavior and peer compatibility.

## Checks

- `pnpm install --frozen-lockfile`
- `pnpm run check` and `pnpm run type-check`
- `pnpm run test:run`
- `pnpm run clean && pnpm run build`
- `RELEASE_TAG=v0.2.4 pnpm run release:prepare` validates without publishing.
  Use `pnpm run release:pack` for archive checks without a tag.

Never hand-edit `dist/` or `.release/`. Preserve the existing package payload.
Follow the [README release procedure](README.md#release-preparation); publish the
validated tarball without rebuilding. Release helpers require current Node 22;
only the consumer smoke runs on Node 20. Tags, publication and credential changes
need explicit approval. Verify registry access before tagging; retain `NPM_TOKEN`
until a replacement is verified.
