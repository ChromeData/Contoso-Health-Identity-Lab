#!/usr/bin/env node
// One-time setup of the hidden recorder on a Windows PC. Safe to run again:
// each part is skipped when it is already done.
//
//   node win/setup.mjs
//
// 1. Two folder links, so the paths the steps use are the same as on the Mac:
//      %USERPROFILE%\contoso-demo\cockpit        -> this folder (demo/recording)
//      %USERPROFILE%\contoso-health-identity-lab -> the lab checkout
// 2. Read-only checkouts of the lab branches the steps show (.v2/<name>), and
//    of main as %USERPROFILE%\contoso-demo\blueprints.
// 3. Hidden VS Code (win/vscode-web.mjs): its settings, the cockpit-bridge
//    extension, the theme and the icon set.
// It changes nothing in the lab tenant and reads no secret.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DATA, DEMO, ROOT, serverDir, startServer, stopServer } from './vscode-web.mjs';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LAB = path.resolve(HERE, '..', '..');
const say = (m) => console.log(m);
const git = (args, cwd = LAB) => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const real = (p) => { try { return fs.realpathSync(p).toLowerCase(); } catch { return null; } };

// ---- 1. folder links ---------------------------------------------------------
function link(from, to) {
  if (real(from) === real(to)) return say(`link ok: ${from}`);
  if (fs.existsSync(from)) throw new Error(`${from} exists and is not a link to ${to}: move it away, then run setup again`);
  fs.mkdirSync(path.dirname(from), { recursive: true });
  fs.symlinkSync(to, from, 'junction');
  say(`link made: ${from} -> ${to}`);
}
link(ROOT, HERE);
link(path.join(os.homedir(), 'contoso-health-identity-lab'), LAB);

// ---- 2. read-only checkouts (lib/teardown.mjs V2_BRANCHES) ----------------------
const BRANCHES = { hr: 'feat/hr-form-inbound', ad: 'harden/ad-tiering', okta: 'feat/okta-depth', pam: 'feat/microsoft-native-pam', k8skv: 'feat/k8s-keyvault',
  kvleak: 'feat/keyvault-state-leak', bastion: 'feat/bastion-session-recording', adfs: 'adfs/dc01-run-and-connect-health', cicd: 'feat/pipeline-secrets-keyvault',
  azlp: 'feat/azure-least-privilege', ssm: 'main', snow: 'feat/servicenow-depth' };
function checkout(dir, branch) {
  let ref = `origin/${branch}`;
  try { git(['fetch', '-q', 'origin', `+refs/heads/${branch}:refs/remotes/origin/${branch}`]); } catch { ref = 'origin/main'; }   // merged and deleted: main has it
  if (!fs.existsSync(path.join(dir, '.git'))) git(['worktree', 'add', '-q', '--detach', dir, ref]);
  else git(['checkout', '-q', '--detach', ref], dir);
  say(`checkout ${path.basename(dir)}: ${ref} ${git(['log', '--format=%h', '-1'], dir)}`);
}
git(['fetch', '-q', 'origin', '+refs/heads/main:refs/remotes/origin/main']);
for (const [k, br] of Object.entries(BRANCHES)) checkout(path.join(HERE, '.v2', k), br);
// The blueprints folder shows part N01's change as changed lines (the bridge
// reads `git diff HEAD`). On the Mac that folder holds the change not yet
// committed. Here: the commit just before the change was merged (PR #204),
// with the two files the part shows as they were after it.
const N01_MERGE = process.env.COCKPIT_N01_MERGE || '3f19d11c0e6a5f268f1f877c0533b0240e1f4a85';
const N01_FILES = ['lab/terraform/modules/entitlement/variables.tf', 'lab/iga/birthright-rules.json'];
{
  const dir = path.join(DEMO, 'blueprints');
  if (!fs.existsSync(path.join(dir, '.git'))) git(['worktree', 'add', '-q', '--detach', dir, `${N01_MERGE}^`]);
  else { git(['checkout', '-q', '--force', '--detach', `${N01_MERGE}^`], dir); }
  git(['checkout', N01_MERGE, '--', ...N01_FILES], dir);
  say(`checkout blueprints: ${git(['log', '--format=%h', '-1'], dir)} + the N01 change in ${N01_FILES.length} files (not committed)`);
}
checkout(path.join(DEMO, 'hr'), 'hr-feed');             // HR's list (detached: nothing is committed from here)
checkout(path.join(HERE, '.tour-main'), 'main');        // the tour's copy of main

// The lab guide's stops (readiness/lab-guide/stops.json, copied from the
// Mac) name their folders with the Mac's home path. On this PC the same
// folders are under %USERPROFILE%\contoso-demo: the roots are rewritten in
// the local copy (it is not in the repo).
const stopsFile = path.join(DEMO, 'readiness', 'lab-guide', 'stops.json');
if (fs.existsSync(stopsFile)) {
  const d = JSON.parse(fs.readFileSync(stopsFile, 'utf8'));
  let n = 0;
  for (const [k, root] of Object.entries(d.roots || {})) {
    const m = /[\\/]contoso-demo(?:[\\/](.*))?$/.exec(root);
    if (!m) continue;
    const here = path.join(DEMO, ...(m[1] ? m[1].split(/[\\/]/) : []));
    if (here !== root) { d.roots[k] = here; n++; }
  }
  if (n) { fs.writeFileSync(stopsFile, JSON.stringify(d, null, 1)); say(`lab guide stops: ${n} folder roots set for this PC`); } else say('lab guide stops: roots ok');
}

// ---- 3. hidden VS Code ----------------------------------------------------------
fs.mkdirSync(path.join(DATA, 'data', 'Machine'), { recursive: true });
fs.writeFileSync(path.join(DATA, 'data', 'Machine', 'settings.json'), JSON.stringify({
  'workbench.startupEditor': 'none', 'workbench.colorTheme': 'GitHub Dark Default', 'workbench.iconTheme': 'material-icon-theme',
  'workbench.secondarySideBar.defaultVisibility': 'hidden', 'workbench.tips.enabled': false, 'workbench.enableExperiments': false,
  'chat.commandCenter.enabled': false, 'chat.disableAIFeatures': true, 'window.commandCenter': false,
  'telemetry.telemetryLevel': 'off', 'update.mode': 'none', 'extensions.autoUpdate': false, 'extensions.autoCheckUpdates': false, 'extensions.ignoreRecommendations': true,
  'git.autofetch': false, 'git.openRepositoryInParentFolders': 'never',
}, null, 2));
if (!serverDir()) { await startServer(say); }          // first use: downloads the server
const wasUp = stopServer();                            // extensions are installed with the server stopped
const cli = path.join(serverDir(), 'bin', 'code-server.cmd');
const have = () => { try { return fs.readdirSync(path.join(DATA, 'extensions')); } catch { return []; } };
const install = (what) => execFileSync('cmd.exe', ['/d', '/s', '/c', `""${cli}" --server-data-dir "${DATA}" --install-extension "${what}" --force"`], { windowsHide: true, windowsVerbatimArguments: true, stdio: 'ignore' });
const bridge = JSON.parse(fs.readFileSync(path.join(HERE, 'vscode-ext', 'package.json'), 'utf8'));
const bridgeDir = `${bridge.publisher}.${bridge.name}-${bridge.version}`;
if (!have().includes(bridgeDir)) {
  const vsix = execFileSync(process.env.CONTOSO_PYTHON || 'python', ['-I', path.join(HERE, 'win', 'build_vsix.py'), DATA], { encoding: 'utf8', windowsHide: true }).trim();
  install(vsix);
  for (const old of have().filter((d) => d.startsWith(`${bridge.publisher}.${bridge.name}-`) && d !== bridgeDir)) fs.rmSync(path.join(DATA, 'extensions', old), { recursive: true, force: true });
}
for (const id of ['GitHub.github-vscode-theme', 'PKief.material-icon-theme']) if (!have().some((d) => d.toLowerCase().startsWith(id.toLowerCase() + '-'))) install(id);
say(`VS Code extensions: ${have().filter((d) => !d.endsWith('.json') && !d.startsWith('.')).join(', ')}`);
if (!have().includes(bridgeDir)) throw new Error(`the bridge ${bridgeDir} did not install`);
if (wasUp) say('the VS Code web server was stopped: the next recording starts it again');
say('setup done');
