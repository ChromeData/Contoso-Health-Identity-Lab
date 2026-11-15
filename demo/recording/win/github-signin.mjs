#!/usr/bin/env node
// One-time GitHub sign-in for the hidden recorder.
//
//   node win/github-signin.mjs [--wait <minutes>]
//
// GitHub is the owner's own account: the recorder has no login for it and
// never types one. Signed out, GitHub shows a public repo but hides the job
// summaries, the job logs and the "Run workflow" button, and the steps that
// point at them fail (N01, N09, N14, N16).
//
// This opens ONE small browser window on the recorder's own profile. You
// sign in there the way you normally do. The window closes by itself when
// you are in. After that the hidden recorder is signed in too.
// Do not run it while a recording runs (the profile is in use).
import path from 'node:path';
import { chromium } from '../lib/browser.mjs';
import { ROOT } from './vscode-web.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wi = process.argv.indexOf('--wait');
const MINUTES = Math.max(1, Number(wi > 0 ? process.argv[wi + 1] : 10) || 10);
const signedIn = async (ctx) => (await ctx.cookies('https://github.com')).some((x) => x.name === 'logged_in' && x.value === 'yes');
let ctx;
try {
  ctx = await chromium.launchPersistentContext(path.join(ROOT, '.recording-profile'), { headless: false, viewport: null, args: ['--window-size=1100,820', '--no-first-run', '--no-default-browser-check'] });
} catch (e) {
  console.error(`could not open the recorder's browser profile (is a recording running?): ${e.message.split('\n')[0]}`);
  process.exit(1);
}
const page = ctx.pages()[0] || await ctx.newPage();
if (await signedIn(ctx)) { console.log('GitHub: already signed in'); await ctx.close(); process.exit(0); }
await page.goto('https://github.com/login');
console.log(`Sign in to GitHub in the window that opened. It closes by itself when you are in (${MINUTES} minutes at most).`);
let ok = false;
for (let k = 0; k < MINUTES * 30 && !ok; k++) { ok = await signedIn(ctx).catch(() => false); if (!ok) await sleep(2000); }
await ctx.close().catch(() => {});
console.log(ok ? 'GitHub: signed in. The hidden recorder can now show job summaries and logs.' : 'GitHub: not signed in.');
process.exit(ok ? 0 : 1);
