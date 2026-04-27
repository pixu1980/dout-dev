#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const VALID_RELEASE_TYPES = new Set(['major', 'minor', 'patch']);

function run(command, args, options = {}) {
  execFileSync(command, args, {
    stdio: 'inherit',
    ...options,
  });
}

function capture(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    ...options,
  }).trim();
}

function getGitStatus() {
  return capture('git', ['status', '--porcelain', '--untracked-files=all']);
}

function ensureCleanWorktree() {
  const status = getGitStatus();

  if (!status) {
    return;
  }

  console.error('Release aborted: commit or stash changes before running a release.');
  console.error(status);
  process.exit(1);
}

function amendGeneratedArtifactsIfNeeded() {
  const status = getGitStatus();

  if (!status) {
    return;
  }

  run('git', ['add', '-A']);
  run('git', ['commit', '--amend', '--no-edit']);
}

export function release(releaseType) {
  if (!VALID_RELEASE_TYPES.has(releaseType)) {
    console.error(`Unsupported release type: ${releaseType}`);
    process.exit(1);
  }

  ensureCleanWorktree();
  run('pnpm', ['-s', 'build'], {
    env: {
      ...process.env,
      CMS_DISABLE_SCHEDULED_DRAFT_PROMPTS: '1',
    },
  });
  amendGeneratedArtifactsIfNeeded();
  run('pnpm', ['version', releaseType, '--message', 'chore(release): v%s']);
  run('git', ['push']);
  run('git', ['push', '--tags']);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  release(process.argv[2]);
}
