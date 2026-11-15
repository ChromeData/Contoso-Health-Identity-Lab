// VS Code for the hidden recorder on Windows.
//
// The Mac cockpit drives a VS Code desktop window. A hidden recorder has no
// desktop, so VS Code runs as its own local web server (`code serve-web`,
// 127.0.0.1 only) and its workbench is one page of the hidden browser. It is
// the same VS Code: same editor, same theme, same Git, and the same
// cockpit-bridge extension (vscode-ext/), which runs in the server's
// extension host and answers on 127.0.0.1 with its token as on the Mac.
//
//   const code = new WebCode(workspaceFile, { context, log });
//   await code.open();                    // server up, workbench loaded, bridge answering
//   await code.call('open', { file, line, endLine, highlightMs: -1 });
//   code.page                             // the workbench page (the picture on camera)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// The demo root with a lower-case drive letter: VS Code reports file paths
// that way, and the bridge compares paths as text.
export const lower = (p) => p.replace(/^([A-Za-z]):/, (m, d) => `${d.toLowerCase()}:`);
export const DEMO = lower(path.join(os.homedir(), 'contoso-demo'));
export const ROOT = path.join(DEMO, 'cockpit');
export const DATA = path.join(ROOT, '.vscode-web');
const REG_DIR = path.join(ROOT, '.state', 'bridges');
export const PORT = +(process.env.COCKPIT_VSCODE_PORT || 47900);
const BASE = `http://127.0.0.1:${PORT}`;

function codeCli() {
  if (process.env.CODE_TUNNEL) return process.env.CODE_TUNNEL;
  const cands = [path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'bin', 'code-tunnel.exe'),
    path.join(process.env.ProgramFiles || '', 'Microsoft VS Code', 'bin', 'code-tunnel.exe')];
  const f = cands.find((c) => fs.existsSync(c));
  if (!f) throw new Error('VS Code is not installed (no bin\\code-tunnel.exe): install VS Code, or set CODE_TUNNEL');
  return f;
}
const up = async () => { try { return (await fetch(BASE, { signal: AbortSignal.timeout(4000) })).ok; } catch { return false; } };

// The server itself (node.exe + out/server-main.js). `code serve-web` downloads
// it once into ~/.vscode/cli/serve-web/<commit>; after that it is started
// directly, because only the server takes --disable-workspace-trust (a
// "Restricted Mode" window does not start the bridge).
export function serverDir() {
  const base = path.join(os.homedir(), '.vscode', 'cli', 'serve-web');
  let dirs = [];
  try { dirs = fs.readdirSync(base).map((d) => path.join(base, d)).filter((d) => fs.existsSync(path.join(d, 'out', 'server-main.js')) && fs.existsSync(path.join(d, 'node.exe'))); } catch {}
  return dirs.sort((x, y) => fs.statSync(y).mtimeMs - fs.statSync(x).mtimeMs)[0] || null;
}
async function download(log) {
  log('VS Code web server: first use, downloading it (one time)');
  const p = spawn(codeCli(), ['serve-web', '--host', '127.0.0.1', '--port', String(PORT), '--without-connection-token', '--accept-server-license-terms', '--server-data-dir', DATA], { windowsHide: true, stdio: 'ignore' });
  try { for (let k = 0; k < 300 && !(await up()); k++) await sleep(1000); } finally { try { execFileSync('taskkill', ['/PID', String(p.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch {} }
  for (let k = 0; k < 20 && (await up()); k++) await sleep(500);
  if (!serverDir()) throw new Error('the VS Code web server did not download (code serve-web)');
}

// Start the server if it is not up. It runs in this process's hidden console
// and ends with it; the recorder also calls stopServer() when it is done.
export async function startServer(log = () => {}) {
  if (await up()) return false;
  fs.mkdirSync(DATA, { recursive: true });
  if (!serverDir()) await download(log);
  const dir = serverDir();
  const out = fs.openSync(path.join(DATA, 'serve.log'), 'a');
  const p = spawn(path.join(dir, 'node.exe'), [path.join(dir, 'out', 'server-main.js'), '--host', '127.0.0.1', '--port', String(PORT), '--without-connection-token', '--accept-server-license-terms',
    '--server-data-dir', DATA, '--disable-workspace-trust', '--telemetry-level', 'off'], { windowsHide: true, stdio: ['ignore', out, out] });
  // Not `detached`: on Windows a detached child has no console at all, so the
  // server's own child processes each open a new, visible terminal window
  // (seen 2026-11-15: a Windows Terminal window titled node.exe). With
  // windowsHide alone the server gets a hidden console that its children
  // share. The server then ends when this process ends, which is wanted:
  // nothing stays behind after a recording.
  p.unref();
  fs.writeFileSync(path.join(DATA, 'server.pid'), String(p.pid));
  for (let k = 0; k < 90; k++) { if (await up()) { log(`VS Code web server up on ${BASE} (pid ${p.pid})`); return true; } await sleep(1000); }
  throw new Error(`the VS Code web server did not start: see ${path.join(DATA, 'serve.log')}`);
}
export function stopServer() {
  const f = path.join(DATA, 'server.pid');
  if (!fs.existsSync(f)) return false;
  try { execFileSync('taskkill', ['/PID', fs.readFileSync(f, 'utf8').trim(), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch {}
  fs.rmSync(f, { force: true });
  return true;
}

function alive(pid) { try { process.kill(pid, 0); return true; } catch { return false; } }
function bridges() {
  let files = [];
  try { files = fs.readdirSync(REG_DIR).filter((f) => f.endsWith('.json')); } catch { return []; }
  const out = [];
  for (const f of files) {
    try {
      const e = JSON.parse(fs.readFileSync(path.join(REG_DIR, f), 'utf8'));
      if (alive(e.pid)) out.push(e); else fs.rmSync(path.join(REG_DIR, f), { force: true });
    } catch {}
  }
  return out.sort((a, b) => (a.started < b.started ? 1 : -1));
}
const same = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

export class WebCode {
  constructor(workspaceFile, { context, log = console.log } = {}) { this.ws = lower(path.resolve(workspaceFile)); this.context = context; this.log = log; this.page = null; }
  find() { return bridges().find((b) => same(b.workspaceFile, this.ws)) || null; }
  get ready() { return !!this.find() && !!this.page && !this.page.isClosed(); }
  get title() { return `${path.basename(this.ws, '.code-workspace')} (Workspace)`; }
  get url() { return `${BASE}/?workspace=/${this.ws.replace(/\\/g, '/')}`; }

  async open({ timeoutMs = 120000 } = {}) {
    await startServer(this.log);
    if (!this.page || this.page.isClosed()) {
      this.page = await this.context.newPage();
      await this.page.goto(this.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await this.page.waitForSelector('.monaco-workbench', { timeout: 60000 });
    }
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      if (this.find()) { try { const info = await this.call('ping'); this.log(`VS Code: ${path.basename(this.ws)} is open, bridge ${info.version || ''}`); return info; } catch {} }
      await sleep(700);
    }
    throw new Error(`the VS Code bridge did not come up for ${path.basename(this.ws)} (is the cockpit-bridge extension installed in ${DATA}?)`);
  }

  async call(op, args = {}) {
    const b = this.find();
    if (!b) throw new Error('VS Code is not open (no bridge)');
    const res = await fetch(`http://127.0.0.1:${b.port}/cmd`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: b.token, op, args }), signal: AbortSignal.timeout(180000) });
    const j = await res.json();
    if (!j.ok) throw new Error(`VS Code ${op}: ${j.error}`);
    return j.result;
  }

  // Toasts and pop-ups that are not part of the demo.
  async tidy() {
    await this.call('command', { id: 'notifications.clearAll' }).catch(() => {});
    await this.call('command', { id: 'workbench.action.closeAuxiliaryBar' }).catch(() => {});
  }
  async close() { try { await this.page?.close(); } catch {} this.page = null; }
}
