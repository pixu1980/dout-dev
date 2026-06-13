import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import * as releaseScript from '../_release.js';

describe('release type detection', () => {
  test('chooses the highest SemVer bump from Conventional Commits', () => {
    assert.equal(
      releaseScript.getReleaseTypeFromMessages?.([
        'fix(search): preserve query filters',
        'feat(posts): add series archive',
        'docs: refresh contribution guide',
      ]),
      'minor'
    );

    assert.equal(
      releaseScript.getReleaseTypeFromMessages?.([
        'feat(api)!: remove legacy feed field',
        'fix(feed): keep generated dates stable',
      ]),
      'major'
    );
  });

  test('detects breaking changes from commit footers', () => {
    assert.equal(
      releaseScript.getReleaseTypeFromMessages?.([
        'feat(feed): rename item field\n\nBREAKING CHANGE: feed consumers must read entry instead',
      ]),
      'major'
    );
  });

  test('falls back to patch for conventional commits below feat', () => {
    assert.equal(
      releaseScript.getReleaseTypeFromMessages?.([
        'Merge branch main',
        'docs: update publishing notes',
        'chore(ci): refresh cache key',
      ]),
      'patch'
    );
  });

  test('throws when no Conventional Commits are present', () => {
    assert.throws(
      () => releaseScript.getReleaseTypeFromMessages?.(['Merge branch main', 'update stuff']),
      /No Conventional Commits found/
    );
  });
});

describe('release git history lookup', () => {
  test('parses git log messages separated by the release delimiter', () => {
    assert.deepEqual(
      releaseScript.parseGitLogMessages?.(
        'feat(ui): add theme\u001efix(css): avoid overflow\u001e'
      ),
      ['feat(ui): add theme', 'fix(css): avoid overflow']
    );
  });

  test('reads commits between the latest tag and HEAD', () => {
    const calls = [];
    const messages = releaseScript.getCommitMessagesSinceTag?.('v0.2.4', {
      captureCommand(command, args) {
        calls.push([command, args]);
        return 'fix(cms): keep generated output stable\u001e';
      },
    });

    assert.deepEqual(calls, [['git', ['log', '--format=%B%x1e', 'v0.2.4..HEAD']]]);
    assert.deepEqual(messages, ['fix(cms): keep generated output stable']);
  });

  test('detects release type from latest tag history', () => {
    const detectedRelease = releaseScript.detectReleaseType?.({
      captureCommand(command, args) {
        if (command === 'git' && args.join(' ') === 'describe --tags --abbrev=0') {
          return 'v0.2.4';
        }

        assert.deepEqual(args, ['log', '--format=%B%x1e', 'v0.2.4..HEAD']);
        return 'feat(template): add include cache\u001e';
      },
    });

    assert.deepEqual(detectedRelease, {
      latestTag: 'v0.2.4',
      releaseType: 'minor',
    });
  });
});

describe('release package script', () => {
  test('uses one automatic release command', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8'));

    assert.equal(manifest.scripts.release, 'node scripts/release/index.js');
    assert.equal(manifest.scripts['rel:major'], undefined);
    assert.equal(manifest.scripts['rel:minor'], undefined);
    assert.equal(manifest.scripts['rel:patch'], undefined);
  });
});
