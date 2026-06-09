#!/usr/bin/env node
/**
 * One-time migration: wrap existing prompt issue bodies in the structured
 * `pl:prompt` section markers used by the app.
 *
 * This is OPTIONAL and behavior-preserving: the app's parser already treats a
 * body without markers as the whole prompt, so copy/AI/variable-filling work
 * unchanged. Running this just makes the canonical structure explicit so future
 * edits (and notes/output examples) have a clear anchor. Bodies that already
 * contain any `pl:` marker are skipped (idempotent). It never separates notes
 * or output examples for you — refine those per-prompt in the editor.
 *
 * Usage:
 *   GITHUB_TOKEN=<token> node scripts/migrate-prompt-bodies.mjs [--dry-run]
 *   # or let the script call `gh auth token` automatically
 */

import { execSync } from 'node:child_process';
import { Octokit } from '@octokit/rest';

const OWNER = 'lettucebo';
const REPO = 'PromptLibrary';
const META_LABEL = 'meta';
const ARCHIVED_LABEL = 'archived';

const isDryRun = process.argv.includes('--dry-run');

function getToken() {
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) return envToken.trim();
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    console.error('ERROR: No GITHUB_TOKEN env var found and `gh auth token` failed.');
    console.error('Set GITHUB_TOKEN or log in with `gh auth login`.');
    process.exit(1);
  }
}

/** True when the body already uses any structured marker. */
function isStructured(body) {
  return /<!--\s*pl:(prompt|notes|outputs)/.test(body ?? '');
}

function wrapPrompt(body) {
  return `<!-- pl:prompt:start -->\n${(body ?? '').trim()}\n<!-- pl:prompt:end -->`;
}

async function main() {
  const token = getToken();
  const octokit = new Octokit({ auth: token });

  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);

  let updated = 0;
  let skipped = 0;
  let page = 1;

  while (true) {
    const { data } = await octokit.rest.issues.listForRepo({
      owner: OWNER,
      repo: REPO,
      state: 'open',
      per_page: 100,
      page,
    });
    if (data.length === 0) break;

    for (const issue of data) {
      if (issue.pull_request) continue;
      const labelNames = (issue.labels || []).map((l) => (typeof l === 'string' ? l : l.name ?? ''));
      if (labelNames.includes(META_LABEL) || labelNames.includes(ARCHIVED_LABEL)) continue;

      const body = issue.body ?? '';
      if (!body.trim() || isStructured(body)) {
        skipped++;
        continue;
      }

      console.log(`#${issue.number} "${issue.title}" → wrap in pl:prompt markers`);
      if (!isDryRun) {
        await octokit.rest.issues.update({
          owner: OWNER,
          repo: REPO,
          issue_number: issue.number,
          body: wrapPrompt(body),
        });
      }
      updated++;
    }

    if (data.length < 100) break;
    page++;
  }

  console.log(`\nWrapped: ${updated}, skipped (empty/already structured): ${skipped}`);
  console.log(isDryRun ? '(dry run — no changes were made)' : 'Migration complete.');
}

main().catch((err) => {
  console.error('Fatal error:', err.message ?? err);
  process.exit(1);
});
