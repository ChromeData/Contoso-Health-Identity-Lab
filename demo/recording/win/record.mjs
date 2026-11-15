#!/usr/bin/env node
// The hidden recorder (Windows): records the v2 parts with no window on the
// screen. It is the PC's `npm run clips`: a silent dry run, one clip per part.
//
//   node win/record.mjs --part 18            record part N18
//   node win/record.mjs --part 18,19,21      record these parts
//   node win/record.mjs --part 18 --check    run the steps, record nothing
//   node win/record.mjs --part 18 --out <dir>
//   node win/record.mjs --part 18 --profile <dir>   another browser profile (the
//                                 usual one is in use); it has no GitHub sign-in
//
// What is the same as the Mac cockpit: the steps (steps.mjs), the browser
// helpers (lib/browser.mjs: highlight box, blur of ids and addresses, pop-up
// closer), the VS Code bridge (vscode-ext/) and the lab's sign-in tool.
// What is different: the browser and VS Code are hidden (win/vscode-web.mjs),
// and the camera reads the pages' own frames (win/screencast.mjs), so there
// is no OBS, no pointer driver and no window to arrange.
//
// A dry run changes nothing in the lab. A step that changes the lab shows
// its captured stand-in, or is skipped and named in the report. The only
// sign-in is the read-only presenter (adm-presenter, PIM-Demo-Readers).
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stepsV2, PIECES_V2 } from '../steps.mjs';
import { Browser, OVERLAY, chromium } from '../lib/browser.mjs';
import { WebCode, DEMO, ROOT, lower } from './vscode-web.mjs';
import { Screencast } from './screencast.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Each step's own wait after a page change is kept in full (lib/browser.mjs
// cuts it to 1.5 s for the Mac, where the hand is slow and a wait is dead
// time on film). Here the camera is off while a page loads, so a wait costs
// nothing, and a click on a portal that is still starting does not hold
// (seen: the Entra user page went back to its first tab).
process.env.COCKPIT_SETTLE ||= 'full';
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const partNo = (x) => +String(x).trim().replace(/^N/i, '').replace(/^(\d+)b$/i, '$1.5');
const parts = (opt('--part', '') || '').split(',').filter(Boolean).map(partNo).filter(Number.isFinite);
if (!parts.length) { console.error('usage: node win/record.mjs --part 18[,19,...] [--check] [--out <dir>] [--pace 1.0]'); process.exit(2); }
const CHECK = flag('--check');
const PACE = +opt('--pace', 1);
const PORT = +opt('--port', 4747);
const LAB = lower(path.join(os.homedir(), 'contoso-health-identity-lab'));
const REPO = 'ChromeData/contoso-health-identity-lab';
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = path.resolve(opt('--out', path.join(DEMO, 'recordings', 'win', stamp)));
fs.mkdirSync(OUT, { recursive: true });
const logFile = path.join(OUT, 'record.log');
const log = (m) => { const line = `${new Date().toLocaleTimeString('en-GB')} ${m}`; console.log(line); fs.appendFileSync(logFile, line + '\n'); };

// The picture: 1920 x 1080. Pages are drawn at 125% (1536 x 864 at scale
// 1.25), as on the Mac; the Entra admin center at 100% (its wide pages).
const W = 1920, H = 1080;
const VIEW = { zoomed: { width: 1536, height: 864, scale: 1.25 }, full: { width: W, height: H, scale: 1 } };
const FULL_SIZE = /^https:\/\/(entra\.microsoft\.com|portal\.azure\.com|security\.microsoft\.com)\//;

// ---- local pages (the map, the cards, the captured screens) -----------------
// Served to this PC only. steps.mjs names them as file:// addresses.
const BASE = `http://localhost:${PORT}`;
const CARD_FILE = path.join(ROOT, 'ui', 'card.html');
const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.webm': 'video/webm', '.mp4': 'video/mp4',
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2' };
const MAP_PAGES = { '/map': 'lab-map.html', '/map/v24': 'v24.html' };
const under = (file, dir) => lower(path.resolve(file)).toLowerCase().startsWith(lower(path.resolve(dir)).toLowerCase() + path.sep);
function toLocal(u) {
  if (typeof u !== 'string' || !u.startsWith('file://')) return u;
  let s = u.slice(7), tail = '';
  const k = s.search(/[?#]/); if (k >= 0) { tail = s.slice(k); s = s.slice(0, k); }
  try { s = decodeURIComponent(s); } catch {}
  if (/^\/[A-Za-z]:/.test(s)) s = s.slice(1);
  const file = path.resolve(s);
  if (lower(file).toLowerCase() === lower(path.resolve(CARD_FILE)).toLowerCase() || /[\\/]ui[\\/]card\.html$/i.test(file)) return `${BASE}/card${tail}`;
  if (!under(file, DEMO)) throw new Error(`${path.basename(file)} is outside ${DEMO}: not served`);
  const rel = path.relative(lower(path.resolve(DEMO)), lower(file)).split(path.sep).map(encodeURIComponent).join('/');
  return `${BASE}/shots/${rel}${tail}`;
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const send = (file, type) => fs.readFile(file, (e, buf) => {
    if (e) { res.writeHead(404); res.end(); return; }
    const head = { 'content-type': type, 'accept-ranges': 'bytes', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
    const r = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (r && (r[1] || r[2])) {
      let a = r[1] ? +r[1] : buf.length - +r[2]; const b = r[1] && r[2] ? Math.min(+r[2], buf.length - 1) : buf.length - 1;
      if (a < 0) a = 0;
      if (a > b || a >= buf.length) { res.writeHead(416, { 'content-range': `bytes */${buf.length}` }); res.end(); return; }
      res.writeHead(206, { ...head, 'content-range': `bytes ${a}-${b}/${buf.length}`, 'content-length': b - a + 1 }); res.end(buf.subarray(a, b + 1)); return;
    }
    res.writeHead(200, { ...head, 'content-length': buf.length }); res.end(buf);
  });
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  const p = url.pathname.replace(/\/$/, '');
  if (MAP_PAGES[p]) return send(path.join(ROOT, 'map', MAP_PAGES[p]), TYPES['.html']);
  if (p === '/card') return send(CARD_FILE, TYPES['.html']);
  if (p.startsWith('/shots/')) {
    let rel; try { rel = decodeURIComponent(p.slice(7)); } catch { res.writeHead(400); res.end(); return; }
    const file = path.resolve(DEMO, rel), type = TYPES[path.extname(file).toLowerCase()];
    if (rel.split('/').some((x) => !x || x === '..') || !under(file, DEMO) || !type) { res.writeHead(404); res.end(); return; }
    return send(file, type);
  }
  res.writeHead(404); res.end();
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(PORT, '127.0.0.1', resolve); });
Browser.MAP_URL = `${BASE}/map`;
const MAP_V24 = `${BASE}/map/v24?video`;

// ---- the hidden browser ---------------------------------------------------------
class HiddenBrowser extends Browser {
  async launch() {
    if (this.ctx) return this;
    fs.mkdirSync(this.profileDir, { recursive: true });
    this.ctx = await chromium.launchPersistentContext(this.profileDir, {
      headless: true, viewport: { width: VIEW.zoomed.width, height: VIEW.zoomed.height }, deviceScaleFactor: VIEW.zoomed.scale, locale: 'en-US',
      args: ['--disable-features=Translate,PasswordLeakDetection', '--no-first-run', '--no-default-browser-check'],
    });
    await this.ctx.addInitScript(OVERLAY);
    this.ctx.on('page', (p) => this._wire(p));
    this.page = this.ctx.pages()[0] || await this.ctx.newPage();
    for (const p of this.ctx.pages()) this._wire(p);
    this.ctx.on('close', () => { this.ctx = null; this.page = null; });
    return this;
  }
  pid() { return null; }
  async activate() { await this.page?.bringToFront().catch(() => {}); return true; }
  async humanOpen() { return false; }
  async reachForToolbar() {}
  // In the hidden browser, a click on a portal page that lives in a frame of
  // another site (the Entra user page) does not arrive while the overlay
  // covers the window, although the overlay takes no pointer events (found
  // 2026-11-15: the Properties tab stayed unselected). The overlay is taken
  // away for the moment of the click.
  async overlay(on) { await this.page.evaluate((show) => { const r = document.getElementById('__ck_root'); if (r) r.style.display = show ? '' : 'none'; }, on).catch(() => {}); }
  async click(target, opts) {
    const { el, x, y } = await this.pointAt(target, opts);
    await this.ov('ripple', x, y); await sleep(150);
    await this.overlay(false);
    try { await el.click({ timeout: 10000 }); } finally { await this.overlay(true); }
  }
  async focusBox(target) {
    const { el } = await this.pointAt(target);
    await this.overlay(false);
    try { await el.click({ timeout: 10000 }); } finally { await this.overlay(true); }
    await this.ov('hideCursor');
  }
  // The page size for this address (see VIEW), set before the page loads.
  // The scale stays 1.25: a full-size page is drawn at 2400 x 1350 and the
  // camera scales it to 1920 x 1080.
  async size(url) {
    const v = FULL_SIZE.test(url) ? VIEW.full : VIEW.zoomed;
    if (this._view === v) return;
    await this.page.setViewportSize({ width: v.width, height: v.height });
    this._view = v;
  }
  async open(url, o = {}) {
    url = toLocal(url);
    if (!this.ctx) await this.launch();
    if (this.page.isClosed()) { this.page = await this.ctx.newPage(); this._view = null; }
    await this.size(url);
    return super.open(url, o);
  }
}

// ---- what the steps need (the engine's init, read only) ---------------------------
const v2 = { ws: path.join(ROOT, 'v2', 'contoso-demo-v2.code-workspace') };
for (const k of ['hr', 'ad', 'okta', 'pam', 'k8skv', 'kvleak', 'bastion', 'adfs', 'cicd', 'azlp', 'ssm', 'snow']) v2[k] = path.join(ROOT, '.v2', k);
for (const [k, d] of Object.entries(v2)) if (!fs.existsSync(d)) { console.error(`missing ${d} (${k}): run "node win/setup.mjs" first`); process.exit(1); }
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const c = { mode: 'dry', today: localDate(), hr: path.join(DEMO, 'hr'), bp: path.join(DEMO, 'blueprints'), bpBranch: 'origin/main (read only)',
  tourLab: path.join(ROOT, '.tour-main'), tourOut: path.join(ROOT, 'tour', 'out'), tourWs: path.join(ROOT, 'tour', 'contoso-demo-tour.code-workspace'), wsFile: v2.ws, v2,
  hire: { first: 'Sam', last: 'Rivera', dept: 'Information Technology', job: 'Cloud Engineer', pkg: 'IT - Cloud Engineering Apps', name: 'Sam Rivera' } };

// Earlier real runs the steps show, read only (the engine's dryStandIns).
const gh = (args) => new Promise((resolve, reject) => execFile('gh', args, { windowsHide: true, maxBuffer: 16 << 20, timeout: 60000 }, (e, so, se) => (e ? reject(new Error((se || e.message).trim().split('\n')[0])) : resolve(so))));
async function standIns() {
  const used = [];
  const tryIt = async (name, fn) => { try { if (await fn()) used.push(name); } catch (e) { log(`stand-ins: ${name}: ${e.message}`); } };
  const latest = async (wf) => JSON.parse(await gh(['run', 'list', '-R', REPO, '--workflow', wf, '--limit', '1', '--json', 'databaseId,url']))[0];
  const n = +(process.env.COCKPIT_STANDIN_PR || 204);
  await tryIt(`PR #${n}`, async () => { const v = JSON.parse(await gh(['pr', 'view', String(n), '-R', REPO, '--json', 'number,url,headRefName,state,mergeCommit'])); c.pr = { number: v.number, url: v.url, headRefName: v.headRefName, state: v.state }; c.mergeSha = v.mergeCommit?.oid; return true; });
  await tryIt('the latest apply run', async () => { const r = await latest('terraform-apply.yml'); if (r) c.applyRun = { id: r.databaseId, url: r.url }; return !!r; });
  await tryIt('the latest HR feed run', async () => { const r = await latest('hr-feed.yml'); if (r) c.hrRun = { id: r.databaseId, url: r.url }; return !!r; });
  await tryIt('the latest evidence run', async () => { const r = await latest('evidence-pack.yml'); if (r) c.evRun = { id: r.databaseId, url: r.url }; return !!r; });
  await tryIt('the approval issue', async () => { const i = JSON.parse(await gh(['issue', 'list', '-R', REPO, '--state', 'all', '--search', '"Approve: apply" in:title', '--limit', '1', '--json', 'number,url,state,title']))[0]; if (i) c.issue = i; return !!i; });
  // Read as the lab operator (read only): the person the steps show, and
  // the newest Sentinel incident about Raj's earlier activation.
  const op = await import(pathToFileURL(path.join(LAB, 'lab', 'scripts', 'operator', 'op-rest.mjs')).href);
  const get = async (url, method = 'GET') => { const r = await op.rest(method, url); if (r.status >= 400) throw new Error(`${r.status} ${r.text.slice(0, 160)}`); return r.text ? JSON.parse(r.text) : {}; };
  const user = async (employeeId) => (await get(`https://graph.microsoft.com/v1.0/users?$filter=employeeId eq '${employeeId}'&$select=id,displayName,userPrincipalName`)).value?.[0] || null;
  await tryIt('the person', async () => {
    const sam = await user('400104');
    if (sam) { c.sam = { id: sam.id, upn: sam.userPrincipalName }; return true; }
    const sofia = await user('100488');
    if (sofia) { c.sam = { id: sofia.id, upn: sofia.userPrincipalName, standIn: sofia.displayName }; used.push(`${sofia.displayName} in place of Sam`); }
    return false;
  });
  if (parts.includes(6)) await tryIt('the PIM incident', async () => {
    const SI = 'https://management.azure.com/subscriptions/de0b2a93-1c62-47b3-aaaf-1bdd1939a274/resourceGroups/rg-identity-lab/providers/Microsoft.OperationalInsights/workspaces/loga-idlab/providers/Microsoft.SecurityInsights/incidents';
    const list = (await get(`${SI}?api-version=2024-09-01&$orderby=properties/createdTimeUtc desc&$top=200`)).value || [];
    for (const x of list.filter((i) => /PIM activation/i.test(i.properties.title))) {
      const ents = (await get(`${SI}/${x.name}/entities?api-version=2024-09-01`, 'POST').catch(() => ({}))).entities || [];
      const accts = ents.filter((e) => e.kind === 'Account').map((e) => `${e.properties.accountName}@${e.properties.upnSuffix || ''}`.toLowerCase());
      if (accts.some((a) => a.startsWith('adm-raj.patel@'))) { c.pimIncident = { name: x.name, number: x.properties.incidentNumber, title: x.properties.title, created: x.properties.createdTimeUtc, providerIncidentId: x.properties.providerIncidentId, accounts: accts }; return true; }
    }
    return false;
  });
  log(`stand-ins (read only): ${used.join(', ') || 'none'}`);
}

// ---- the stage ------------------------------------------------------------------
const cam = new Screencast({ fps: +opt('--fps', 15), width: W, height: H, log });
const B = new HiddenBrowser({ profileDir: path.resolve(opt('--profile', path.join(ROOT, '.recording-profile'))), width: W, height: H, shotsDir: path.join(OUT, 'shots'), log });
let codeBrowser = null;
const codes = new Map();    // workspace file -> WebCode
let V = null;
async function codeFor(ws) {
  const key = lower(path.resolve(ws)).toLowerCase();
  if (!codes.has(key)) {
    codeBrowser ||= await chromium.launch({ headless: true });
    const ctx = await codeBrowser.newContext({ viewport: { width: VIEW.zoomed.width, height: VIEW.zoomed.height }, deviceScaleFactor: VIEW.zoomed.scale, locale: 'en-US' });
    codes.set(key, new WebCode(ws, { context: ctx, log }));
  }
  const v = codes.get(key);
  if (!v.ready) {
    await v.open(); await sleep(1500); await v.tidy();
    await v.call('command', { id: 'workbench.action.closeSidebar' }).catch(() => {});
    // The recording look (no activity bar, no status bar) is a workspace
    // setting the bridge writes. It is set off, then on: the window only
    // follows a change. close() puts the workspace file back.
    await v.call('chrome', { hidden: false }).catch(() => {}); await sleep(500);
    await v.call('chrome', { hidden: true }).catch((e) => log(`VS Code: bars not hidden: ${e.message}`)); await sleep(800);
  }
  return v;
}
// The private window: one more person's own sign-in, in a context of its own
// (never mixed with the presenter's). It closes with the run; nothing is kept.
let P = null;
async function priv() {
  if (P && !P.page.isClosed()) return P;
  codeBrowser ||= await chromium.launch({ headless: true });
  const ctx = await codeBrowser.newContext({ viewport: { width: VIEW.full.width, height: VIEW.full.height }, deviceScaleFactor: VIEW.full.scale, locale: 'en-US' });
  await ctx.addInitScript(OVERLAY);
  const page = await ctx.newPage();
  P = Object.create(B);
  Object.assign(P, { ctx, page, size: async () => {}, open: async (url, o) => { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); await sleep(o?.settle ?? 2500); } });
  return P;
}
async function front(app) {
  if (app === 'private') { const p = await priv(); await cam.show(p.page); c.front = app; return; }
  if (app === 'code') { if (!V?.ready) V = await codeFor(c.wsFile); await cam.show(V.page); }
  else { if (!B.up) await B.launch(); await cam.show(B.page); }
  c.front = app;
}

// ---- sign-in: the read-only presenter only ----------------------------------------
const PRESENTER = { id: 'adm-presenter', url: 'https://entra.microsoft.com/', pim: { group: 'PIM-Demo-Readers', hours: 8, reason: 'Recording the Contoso Health demo: read-only portal views' } };
let T = null, entraReady = false;
async function ensureEntra() {
  if (entraReady) return;
  T ||= await import(pathToFileURL(path.join(LAB, 'lab', 'scripts', 'demo', 'signin', 'identity.mjs')).href);
  if (!B.up) await B.launch();
  await B.size(PRESENTER.url);
  log(`sign-in: ${PRESENTER.id} (read only)`);
  await T.signIn(PRESENTER.id, PRESENTER.url, { context: B.ctx, page: B.page });
  const active = T.pimRecords(PRESENTER.id).find((r) => r.group === PRESENTER.pim.group && Date.parse(r.endsUtc) - Date.now() > 45 * 60000);
  if (active) log(`sign-in: ${PRESENTER.pim.group} is active until ${active.endsUtc}`);
  else { log(`sign-in: activating ${PRESENTER.pim.group} for ${PRESENTER.pim.hours} h (read-only roles)`); const r = await T.activatePim(PRESENTER.id, PRESENTER.pim.group, PRESENTER.pim.hours, PRESENTER.pim.reason, { context: B.ctx }); await r.page?.close().catch(() => {}); }
  T.keepSignedIn(B.ctx, PRESENTER.id, { onEvent: (m) => log(`sign-in: ${m}`) });
  entraReady = true;
}

// Splunk (the local container): its own admin, in the hidden browser. The
// password is the one splunk-up.sh made in lab/splunk/.env on this PC.
const SPLUNK = { id: 'splunk-admin', url: 'http://127.0.0.1:8000/en-US/app/search/search' };
let splunkReady = false;
async function ensureSplunk() {
  if (splunkReady) return;
  T ||= await import(pathToFileURL(path.join(LAB, 'lab', 'scripts', 'demo', 'signin', 'identity.mjs')).href);
  if (!B.up) await B.launch();
  log(`sign-in: ${SPLUNK.id} (local Splunk)`);
  const r = await T.signIn(SPLUNK.id, SPLUNK.url, { context: B.ctx });
  await r?.close?.();
  splunkReady = true;
}

// ---- actions (the engine's act(), dry) ----------------------------------------------
const WRITE = new Set(['cloudsync.restart', 'pod', 'code.type', 'code.save', 'code.commit', 'code.push', 'gh.createPr', 'gh.merge', 'gh.closePr', 'gh.runWorkflow', 'tap.signin', 'staff.signin',
  'drill.ensure', 'preview.approve', 'preview.contain', 'preview.secondCheck', 'identity.signin', 'pim.deactivate', 'hr.hire', 'hr.leave']);
const CLICKY = new Set(['web.click', 'web.type', 'private.click', 'private.type']);
const NAV = new Set(['identity.signin', 'private.open', 'code.stop', 'code.check', 'web.open', 'activate', 'find', 'require', 'code.open', 'code.closeAll', 'web.waitFor', 'web.find', 'web.clickIf', 'gh.openJob', 'gh.planComment']);
const VISUAL = new Set(['private.click', 'private.highlight', 'map.focus', 'web.video', 'web.show', 'web.click', 'web.highlight', 'code.highlight', 'code.command', 'code.tree', 'card']);
const VISUAL_AFTER = new Set(['code.diff', 'code.file', 'code.changes', 'code.stop', 'code.check']);
const FOLLOW = new Set(['web.highlight', 'private.highlight', 'code.highlight']);
const val = (v) => {
  if (typeof v !== 'function') return v;
  let r; try { r = v(c); } catch { r = null; }
  if (r == null) throw new Error('needs a value from an earlier live step (PR, run or Sam) that this run does not have');
  return r;
};
async function act(a, s) {
  switch (a.do) {
    case 'code.open': { if (a.ws) c.wsFile = a.ws; V = await codeFor(c.wsFile); await front('code'); await V.call('command', { id: 'notifications.clearAll' }).catch(() => {}); break; }
    case 'code.closeAll': await front('code'); await V.call('command', { id: 'workbench.action.closeUnmodifiedEditors' }); break;
    case 'code.diff': await front('code'); await V.call('diff', { file: a.file, line: a.line, endLine: a.endLine, highlightMs: a.highlight ? -1 : 0 }); break;
    case 'code.changes': { await front('code'); const r = await V.call('changes', { file: a.file, from: a.from, to: a.to, line: a.line }); log(`[${s.id}] ${path.basename(a.file)}: changed lines ${r.lines.join(',')}`); break; }
    case 'code.file': await front('code'); await V.call('open', { file: a.file, line: a.line, endLine: a.endLine, highlightMs: a.highlight ? -1 : 0 }); break;
    case 'code.highlight': await front('code'); await V.call('highlight', { file: a.file, line: a.line, endLine: a.endLine, ms: 0, side: a.side || 'after' }); break;
    case 'code.command': await front('code'); await V.call('command', { id: a.id, args: a.args || [] }); break;
    case 'code.stop': { await front('code'); const r = await V.call('openStop', { stop: a.stop }); await V.call('command', { id: 'workbench.action.closeSidebar' }).catch(() => {}); log(`[${s.id}] lab guide stop ${r?.n} (${r?.stop}): ${r?.files?.length} tab(s)`); break; }
    case 'code.tree': {
      await front('code');
      await V.call('command', { id: 'workbench.view.explorer' });
      await V.call('command', { id: 'workbench.files.action.collapseExplorerFolders' }).catch(() => {});
      await cam.resume();
      for (const f of a.reveal || []) { await V.call('command', { id: 'revealInExplorer', args: [path.join(a.folder, f)] }); await sleep(a.every ?? 2200); }
      break;
    }
    case 'web.open': {
      if (a.ctx && a.ctx !== 'browser') throw new Error(`not in the hidden recorder yet: the ${a.ctx} window`);
      const url = val(a.url);
      await front('browser');
      let need = await B.open(url, { settle: a.settle ?? 2500 });
      if (need && /Microsoft/.test(need)) { entraReady = false; await ensureEntra(); need = await B.open(url, { settle: a.settle ?? 2500 }); }
      if (need === 'Splunk') { splunkReady = false; await ensureSplunk(); need = await B.open(url, { settle: a.settle ?? 2500 }); }
      if (need) throw new Error(`${need}: this page needs a sign-in the hidden recorder does not have`);
      await cam.show(B.page);
      if (a.deny && new RegExp(a.deny, 'i').test(await B.page.locator('body').innerText().catch(() => ''))) throw new Error('the page refuses this identity: it needs a role that can see it');
      break;
    }
    // One job of the newest finished run of a workflow on main, or a pull
    // request's plan comment (both read only, found with the gh CLI).
    case 'gh.openJob': case 'gh.planComment': {
      let url;
      if (a.do === 'gh.openJob') {
        const runs = JSON.parse(await gh(['run', 'list', '-R', REPO, '--workflow', a.workflow, '--branch', 'main', '--limit', '20', '--json', 'databaseId,status,conclusion,event']));
        const run = runs.find((r) => r.status === 'completed' && r.conclusion === 'success' && r.event === 'push') || runs.find((r) => r.status === 'completed');
        if (!run) throw new Error(`no finished ${a.workflow} run on main`);
        const jobs = JSON.parse(await gh(['api', `repos/${REPO}/actions/runs/${run.databaseId}/jobs?per_page=100`])).jobs || [];
        const j = jobs.find((x) => new RegExp(a.job, 'i').test(x.name));
        if (!j) throw new Error(`no job like "${a.job}" in ${a.workflow} run ${run.databaseId}`);
        url = j.html_url;
      } else {
        const comments = JSON.parse(await gh(['api', `repos/${REPO}/issues/${a.pr}/comments?per_page=100`]));
        const plan = comments.find((x) => x.user?.login === 'github-actions[bot]' && (x.body || '').startsWith('## Terraform plan'));
        url = plan?.html_url || `https://github.com/${REPO}/pull/${a.pr}`;
      }
      await front('browser');
      const need = await B.open(url, { settle: 5000 });
      if (need) throw new Error(`${need}: this page needs a sign-in the hidden recorder does not have`);
      await cam.show(B.page);
      break;
    }
    case 'web.find': await B.find(val(a.target), { timeout: a.timeout ?? 15000 }); break;
    case 'web.waitFor': {
      const end = Date.now() + (a.timeout ?? 180000); let found = false;
      while (!found && Date.now() < end) {
        found = await B.find(val(a.target), { timeout: 8000 }).then(() => true, () => false);
        if (!found) { await B.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(a.every ?? 12000); }
      }
      if (!found) throw new Error(`not on the page after ${Math.round((a.timeout ?? 180000) / 1000)} s: ${JSON.stringify(val(a.target))}`);
      break;
    }
    case 'web.highlight': {
      const ts = [].concat(val(a.target)); let last;
      for (const t of ts) { try { await B.highlight(t, val(a.tag) || ''); last = null; break; } catch (e) { last = e; } }
      if (last) throw last;
      break;
    }
    case 'web.click': {
      await B.unhighlight();
      const ts = [].concat(val(a.target)); let err;
      let hit = null;
      for (const t of ts) { try { await B.find(t, { timeout: Math.round((a.timeout ?? 15000) / ts.length) }); await B.click(t); err = null; hit = t; break; } catch (e) { err = e; } }
      if (err) throw err;
      await B.settle(a.settle ?? 2500);
      // A tab clicked while the portal is still starting can stay unselected
      // (the Mac's hand is slower than a hidden click): look, and click again.
      if (hit?.role === 'tab') for (let k = 0; k < 3; k++) {
        const sel = await B.find(hit, { timeout: 3000 }).then((f) => f.el.getAttribute('aria-selected'), () => null);
        if (sel !== 'false') break;
        await sleep(1500); await B.click(hit).catch(() => {}); await B.settle(a.settle ?? 2500);
      }
      break;
    }
    case 'web.clickIf': { const t = val(a.target); if (await B.find(t, { timeout: a.timeout ?? 6000 }).then(() => true, () => false)) { await B.click(t); await B.settle(a.settle ?? 3000); } break; }
    case 'card': {
      const url = toLocal(a.url);
      if (c.front === 'browser' && B.page && !B.page.isClosed() && B.page.url().split('#')[0] === url.split('#')[0]) { await B.page.evaluate((h) => { location.hash = h; }, url.split('#')[1]); await sleep(150); break; }
      await front('browser'); await B.open(url, { settle: a.settle ?? 250 }); await cam.show(B.page);
      break;
    }
    case 'web.show': {
      if (!/^file:/.test(a.url)) throw new Error('web.show is for local captured screens (a file:// address in steps.mjs)');
      await front('browser');
      await B.open(a.url, { settle: a.settle ?? 300 });
      await B.page.evaluate(() => { if (/^image\//.test(document.contentType) && !document.getElementById('__ck_fit')) { const st = document.createElement('style'); st.id = '__ck_fit'; st.textContent = 'html,body{background:#0d1117!important}img{max-width:100vw!important;max-height:100vh!important;width:auto!important;height:auto!important;object-fit:contain;cursor:default!important}'; document.head.appendChild(st); } }).catch(() => {});
      await cam.show(B.page);
      break;
    }
    case 'web.video': {
      await front('browser');
      await B.open(a.url, { settle: 600 });
      await B.page.evaluate(async (at) => { const v = document.querySelector('video'); if (!v) throw new Error('no video on the page'); v.muted = true; v.currentTime = at || 0; await v.play(); }, a.at || 0);
      await cam.show(B.page);
      break;
    }
    case 'map.focus': {
      const onMap = c.front === 'browser' && B.page && !B.page.isClosed() && B.page.url().split('?')[0] === MAP_V24.split('?')[0];
      if (!onMap) {
        const rolling = cam.rolling; if (rolling) await cam.pause();
        await front('browser');
        await B.open(MAP_V24, { settle: 300 });
        await B.page.waitForFunction(() => typeof window.__mapFocus === 'function', null, { timeout: 15000 });
        await sleep(1100);
        await B.page.evaluate(() => window.__mapFocus('overview')).catch((e) => log(`[${s.id}] map overview: ${e.message.split('\n')[0]}`));
        await sleep(900);   // the fly to the overview has landed before the camera rolls
        await cam.show(B.page);
        await cam.resume();
      }
      const r = await B.page.evaluate((t) => window.__mapFocus(t), a.target);
      log(`[${s.id}] map: ${r}`);
      break;
    }
    case 'banner': case 'banner.previewOnly': { if (a.do === 'banner.previewOnly') break; if (a.ctx && a.ctx !== 'browser') break; await B.page?.evaluate((t) => window.__ck && window.__ck.banner(t), val(a.text)).catch(() => {}); break; }
    case 'activate': if (['code', 'browser', 'private'].includes(a.app)) await front(a.app); else throw new Error(`not in the hidden recorder yet: the ${a.app} window`); break;
    // A lab person signs in, in the private window, with the lab's sign-in
    // tool (passkey or code from this PC's Credential Manager). A sign-in
    // changes nothing in the lab. The owner's account and the emergency
    // accounts are refused by the tool itself.
    case 'identity.signin': {
      T ||= await import(pathToFileURL(path.join(LAB, 'lab', 'scripts', 'demo', 'signin', 'identity.mjs')).href);
      const p = await priv();
      log(`sign-in: ${a.id} (private window)`);
      await T.signIn(a.id, a.url, { context: p.ctx, page: p.page });
      await p.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
      await sleep(2500);
      await front('private');
      break;
    }
    case 'private.open': { const p = await priv(); await front('private'); await p.open(val(a.url), { settle: a.settle ?? 3000 }); await cam.show(p.page); break; }
    case 'private.click': { const p = await priv(); await p.click(a.target); await p.settle(a.settle ?? 2500); break; }
    case 'private.highlight': {
      const p = await priv(); const ts = [].concat(val(a.target)); let last;
      if (c.front !== 'private') await front('private');
      for (const t of ts) { try { await p.highlight(t, val(a.tag) || ''); last = null; break; } catch (e) { last = e; } }
      if (last) throw last;
      break;
    }
    case 'pause': await sleep(a.ms || 1000); break;
    case 'find': if (a.what === 'sam') { if (!c.sam) throw new Error('Sam is not in Entra now, and there is no stand-in user'); if (c.sam.standIn) log(`[${s.id}] Sam is not in Entra now: showing ${c.sam.standIn}`); } break;
    case 'require': log(`[${s.id}] check "${a.check}" not run (dry)`); break;
    case 'stopwatch.start': case 'stopwatch.lap': case 'stopwatch.stop': break;
    default: throw new Error(`not in the hidden recorder yet: ${a.do}`);
  }
}

// Time on screen for a line (silent clips: the caption must be read).
const words = (s) => s.say.join(' ').split(/\s+/).filter(Boolean).length;
const holdMs = (s) => Math.round(Math.max(3500, Math.min(16000, words(s) / 2.7 * 1000)) * PACE);

async function runStep(s, report) {
  const standIn = !!((s.cloud || s.previewStandIn) && s.standIn);
  const all = standIn ? s.standIn : (s.do || []);
  // identity.signin is in the engine's list of writes (a dry run on the Mac does not sign people in). Here it is done: it is the only way to show that person's page.
  const skipped = all.filter((a) => !a.previewOnly && a.do !== 'identity.signin' && (WRITE.has(a.do) || (s.write && CLICKY.has(a.do))));
  const acts = all.filter((a) => !a.previewOnly && !skipped.includes(a));
  const follows = acts.filter((a) => FOLLOW.has(a.do)).length;
  const total = holdMs(s);
  log(`[${s.id}]${standIn ? ' (stand-in)' : ''} ${s.say[0]}`);
  for (const a of skipped) log(`[${s.id}] not done (it changes the lab): ${a.do}`);
  const at = cam.position();
  let failed = null, waited = 0, k = 0;
  for (const a of acts) {
    // A click that only gets to a page is not filmed (the page it loads is
    // not the picture): the camera rolls again for the highlight. A step
    // marked showClicks films its clicks.
    const getsThere = /^(web\.click(If)?|private\.click)$/.test(a.do) && !s.showClicks;
    // The camera starts again AFTER an action that shows something (below):
    // a highlight first waits for its element, and that wait is not filmed.
    if (NAV.has(a.do) || getsThere) await cam.pause();
    if (FOLLOW.has(a.do)) { if (k > 0) { const w = Math.round(total / (follows + 1)); await sleep(w); waited += w; } k++; }
    try {
      await act(a, s);
      if (!getsThere && (VISUAL_AFTER.has(a.do) || VISUAL.has(a.do))) { await sleep(250); await cam.resume(); }
    } catch (e) {
      failed = `${a.do}: ${e.message.split('\n')[0]}`;
      log(`[${s.id}] FAILED ${failed}`);
      if (/^(web\.open|find|code\.open)$/.test(a.do)) break;
    }
  }
  // A stand-in person on screen is named on screen (the line still says Sam).
  if (!failed && c.sam?.standIn && acts.some((a) => a.do === 'find' && a.what === 'sam') && c.front === 'browser') {
    await B.page?.evaluate((t) => window.__ck && window.__ck.banner(t), `Stand-in: ${c.sam.standIn} is on screen. Sam Rivera is not hired in the lab now.`).catch(() => {});
  }
  if (!cam.rolling && cam.onStage) { await sleep(350); await cam.resume(); }
  if (cam.onStage && !CHECK) {
    await sleep(Math.max(1200, Math.min(total - waited, 2500)));
    await cam.onStage.screenshot({ path: path.join(OUT, 'shots', `${s.id}.jpg`), type: 'jpeg', quality: 80 }).catch(() => {});
    await sleep(Math.max(0, total - waited - 2500));
  } else if (cam.onStage) { await sleep(800); await cam.onStage.screenshot({ path: path.join(OUT, 'shots', `${s.id}.jpg`), type: 'jpeg', quality: 80 }).catch(() => {}); }
  report.push({ id: s.id, piece: s.piece, at: +at.toFixed(2), end: +cam.position().toFixed(2), ok: !failed, failed, standIn, skipped: skipped.map((a) => a.do), say: s.say });
  return !failed;
}

// ---- run ---------------------------------------------------------------------------
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
let exit = 0;
const lines = [];
try {
  await standIns();
  // Every run here is a preview: a step that has a preview line (it says what
  // is on screen when an earlier run is shown) uses that line, as the Mac's
  // preview does.
  const list = stepsV2(c).filter((x) => parts.includes(x.piece) && !x.pending && !x.silentSkip).map((x) => (x.previewSay ? { ...x, say: x.previewSay } : x));
  for (const n of parts) {
    const piece = PIECES_V2.find((p) => p.n === n);
    const steps = list.filter((x) => x.piece === n);
    if (!piece || !steps.length) { log(`part ${n}: no steps`); exit = 1; continue; }
    log(`==== ${piece.slug}: ${steps.length} steps${CHECK ? ' (check only)' : ''}`);
    const other = (piece.sessions || []).filter((x) => x !== 'entra' && x !== 'splunk');
    if (other.length) log(`${piece.slug}: needs ${other.join(', ')}: steps in those windows will fail (not in the hidden recorder yet)`);
    if ((piece.sessions || []).includes('entra')) await ensureEntra();
    if ((piece.sessions || []).includes('splunk')) await ensureSplunk();
    const report = [];
    const file = path.join(OUT, `${piece.slug}.mp4`);
    if (!CHECK) { await cam.start(file); await cam.pause(); }
    for (const s of steps) await runStep(s, report);
    if (!CHECK) await cam.stop();
    const bad = report.filter((r) => !r.ok);
    fs.writeFileSync(path.join(OUT, `${piece.slug}.timeline.json`), JSON.stringify({ part: piece.slug, title: piece.title, recorded: new Date().toISOString(), fps: cam.fps, steps: report }, null, 1));
    // The caption lines, in the form tools/caption.py reads (all parts of this run).
    lines.push(...report.map((r) => ({ id: r.id, piece: r.piece, at: r.at, end: r.end, text: r.say.join(' ') })));
    fs.writeFileSync(path.join(OUT, 'watch-lines.json'), JSON.stringify(lines, null, 1));
    log(`==== ${piece.slug}: ${report.length - bad.length}/${report.length} steps ok${bad.length ? `; FAILED: ${bad.map((r) => `${r.id} (${r.failed})`).join('; ')}` : ''}`);
    if (bad.length) exit = 1;
  }
} catch (e) { log(`STOPPED: ${e.stack || e.message}`); exit = 1; }
await cam.close().catch(() => {});
for (const v of codes.values()) { await v.call('chrome', { hidden: false }).catch(() => {}); await v.close().catch(() => {}); }
await P?.ctx.close().catch(() => {});
await codeBrowser?.close().catch(() => {});
await B.close().catch(() => {});
server.close();
log(`output: ${OUT}`);
process.exit(exit);
