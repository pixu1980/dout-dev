#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

const GIT_LOG_COMMIT_SEPARATOR = '\u001e';
const CONVENTIONAL_COMMIT_SUBJECT_PATTERN =
  /^(?<type>[a-z][a-z0-9-]*)(?:\([^)]+\))?(?<breaking>!)?: .+/i;
const BREAKING_CHANGE_PATTERN = /^BREAKING[ -]CHANGE:\s+.+/im;
const RELEASE_TYPE_PRIORITY = Object.freeze({
  patch: 1,
  minor: 2,
  major: 3,
});

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

function getCommitReleaseType(message) {
  const [subject = ''] = message.trimStart().split(/\r?\n/);
  const match = subject.match(CONVENTIONAL_COMMIT_SUBJECT_PATTERN);

  if (!match) {
    return null;
  }

  if (match.groups.breaking || BREAKING_CHANGE_PATTERN.test(message)) {
    return 'major';
  }

  if (match.groups.type.toLowerCase() === 'feat') {
    return 'minor';
  }

  return 'patch';
}

function isHigherReleaseType(candidate, current) {
  return RELEASE_TYPE_PRIORITY[candidate] > RELEASE_TYPE_PRIORITY[current];
}

/**
 * Parse git log output generated with the release script commit separator.
 */
export function parseGitLogMessages(logOutput) {
  return logOutput
    .split(GIT_LOG_COMMIT_SEPARATOR)
    .map((message) => message.trim())
    .filter(Boolean);
}

/**
 * Resolve the SemVer bump required by Conventional Commit messages.
 */
export function getReleaseTypeFromMessages(messages) {
  let releaseType = null;

  for (const message of messages) {
    const commitReleaseType = getCommitReleaseType(message);

    if (!commitReleaseType) {
      continue;
    }

    if (!releaseType || isHigherReleaseType(commitReleaseType, releaseType)) {
      releaseType = commitReleaseType;
    }
  }

  if (!releaseType) {
    throw new Error('No Conventional Commits found since the latest tag.');
  }

  return releaseType;
}

/**
 * Return the newest reachable git tag, or an empty string when none exists.
 */
export function getLatestTag({ captureCommand = capture } = {}) {
  try {
    return captureCommand('git', ['describe', '--tags', '--abbrev=0']);
  } catch {
    return '';
  }
}

/**
 * Read commit messages between the latest release tag and HEAD.
 */
export function getCommitMessagesSinceTag(tag, { captureCommand = capture } = {}) {
  const args = ['log', `--format=%B%x1e`];

  if (tag) {
    args.push(`${tag}..HEAD`);
  }

  return parseGitLogMessages(captureCommand('git', args));
}

/**
 * Detect the release type from Conventional Commits since the latest tag.
 */
export function detectReleaseType({ captureCommand = capture } = {}) {
  const latestTag = getLatestTag({ captureCommand });
  const messages = getCommitMessagesSinceTag(latestTag, { captureCommand });

  return {
    latestTag,
    releaseType: getReleaseTypeFromMessages(messages),
  };
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

/**
 * Prompt the user with a yes/no question at the terminal.
 */
export async function askYesNo(question) {
  const rl = createInterface({ input, output });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

export async function release() {
  ensureCleanWorktree();

  let detectedRelease;
  try {
    detectedRelease = detectReleaseType();
  } catch (error) {
    if (!error.message.includes('No Conventional Commits found')) {
      throw error;
    }

    console.error(error.message);
    const proceed = await askYesNo(
      "Nessun Conventional Commit trovato dall'ultimo tag. Forzare una release patch? (y/N): "
    );

    if (!proceed) {
      console.log('Release annullata.');
      process.exit(1);
    }

    const latestTag = getLatestTag();
    detectedRelease = { latestTag, releaseType: 'patch' };
  }

  console.log(
    `Detected ${detectedRelease.releaseType} release from Conventional Commits since ${detectedRelease.latestTag || 'the first commit'}.`
  );

  run('pnpm', ['-s', 'build'], {
    env: {
      ...process.env,
      CMS_DISABLE_SCHEDULED_DRAFT_PROMPTS: '1',
    },
  });
  amendGeneratedArtifactsIfNeeded();
  run('pnpm', ['version', detectedRelease.releaseType, '--message', 'chore(release): v%s']);
  run('git', ['push']);
  run('git', ['push', '--tags']);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2]) {
    console.error('Usage: node scripts/release/index.js');
    process.exit(1);
  }

  await release();
}
