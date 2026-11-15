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
need explicit approval. npm publication uses OIDC from `release.yml` on GitHub-hosted
runners with npm 11.20.0. Keep its filename and environment aligned with the npm
trusted publisher; do not add a publish token. A dry run does not prove npm trust.

PR archive dry runs use `--force` to allow existing versions; `release:pack` still
validates stable SemVer. Never pass `--force` to real publication.
