import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateReleaseTag } from './validate-tag.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const artifacts = join(root, '.release');
const consumer = join(artifacts, 'consumer');
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  name: string;
  version: string;
  packageManager: string;
};
if (manifest.name !== 'github-typescript-utils') {
  throw new Error('Unexpected package name');
}
validateReleaseTag(`v${manifest.version}`, manifest.version);

rmSync(artifacts, { recursive: true, force: true });
mkdirSync(consumer, { recursive: true });
execFileSync('pnpm', ['pack', '--pack-destination', artifacts], { cwd: root, stdio: 'inherit' });
const archive = join(artifacts, 'package.tgz');
copyFileSync(join(artifacts, `${manifest.name}-${manifest.version}.tgz`), archive);
const digest = createHash('sha256').update(readFileSync(archive)).digest('hex');

function installedVersion(name: string): string {
  const dependency = JSON.parse(
    readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8')
  ) as { version: string };
  return dependency.version;
}

writeFileSync(
  join(consumer, 'package.json'),
  `${JSON.stringify(
    {
      name: 'github-typescript-utils-release-consumer',
      private: true,
      type: 'module',
      packageManager: manifest.packageManager,
      dependencies: {
        'github-typescript-utils': `file:${archive}`,
        '@actions/core': installedVersion('@actions/core'),
        '@actions/github': installedVersion('@actions/github'),
      },
      devDependencies: { '@types/node': installedVersion('@types/node') },
    },
    null,
    2
  )}\n`
);
for (const file of ['check.mjs', 'consumer.ts', 'tsconfig.json']) {
  copyFileSync(new URL(`./consumer/${file}`, import.meta.url), join(consumer, file));
}
execFileSync('pnpm', ['install', '--no-frozen-lockfile', '--ignore-scripts'], {
  cwd: consumer,
  stdio: 'inherit',
});
execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', consumer], {
  cwd: consumer,
  stdio: 'inherit',
});
execFileSync(process.execPath, ['check.mjs'], { cwd: consumer, stdio: 'inherit' });
writeFileSync(join(artifacts, 'package.sha256'), `${digest}  .release/package.tgz\n`);
console.log(`Validated ${manifest.name}@${manifest.version}, SHA-256 ${digest}`);
