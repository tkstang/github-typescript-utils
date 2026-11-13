# github-typescript-utils

ESM TypeScript utilities for GitHub Actions. Preserve public helper signatures,
marker matching, branch semantics and peer compatibility unless the task explicitly
changes their contract. The package supports Node >=20; development and CI use
current Node 22 from .nvmrc and pnpm 10.13.1 from packageManager.

## Commands and checks

- pnpm install --frozen-lockfile
- pnpm run check: Biome for src/ and release scripts.
- pnpm run type-check: source plus the separate native-TypeScript scripts checker.
- pnpm run test:run: Vitest, including the release-tag tests.
- pnpm run clean && pnpm run build: fresh compiled package.
- pnpm run release:check v0.2.4: validate an exact full stable tag against package.json.
- RELEASE_TAG=v0.2.4 pnpm run release:prepare: tag check, owning checks/tests,
  clean build and installed-archive validation. This does not publish.
- pnpm run release:pack: clean build, pack and public import/declaration proof without
  requiring a release tag. It replaces ignored .release/ output.

Read the README release section before changing those commands. Release helpers use
native erasable TypeScript on current Node 22; the Node 20 consumer smoke is plain
JavaScript. Do not run the development helpers with Node 20.

## Release boundaries

The release workflow checks out the event SHA, rejects partial/mismatched tags,
validates .release/package.tgz and tests its installed consumer on Node 20.0.0.
It checks the archive checksum and publishes that exact tarball with lifecycle
scripts disabled, because checks/tests/build already ran. Never hand-edit dist/ or
.release/. The current broad source/test payload in the package is retained.

Preparation does not authorize publishing, tag mutation or credential changes.
NPM_TOKEN remains the publication credential reference. An id-token permission does
not establish configured npm trust. Account-side access/trust remains unverified;
do not remove the token or claim OIDC readiness without separately verified setup.
