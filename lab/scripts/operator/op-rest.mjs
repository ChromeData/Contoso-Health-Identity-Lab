#!/usr/bin/env node
// =============================================================================
// op-rest.mjs - one REST call AS THE LAB OPERATOR, with no az CLI and no bash
// -----------------------------------------------------------------------------
//   node op-rest.mjs --method GET --url https://graph.microsoft.com/v1.0/organization
//   node op-rest.mjs --method POST --url <url> --body-stdin   < body.json
//
// The Windows stand-in for `op az rest` (a PC has no az CLI and the `op`
// wrapper is bash). It is the SAME identity: the operator app in
// ~/.contoso-operator/config, its public certificate operator.crt, and the
// private key from the machine's secret store (Windows Credential Manager,
// or the Keychain on a Mac). The key is used in this process only: it signs
// a five-minute client assertion, which is traded for an access token for
// the host in --url. The key and the tokens are never written to a file,
// never printed.
//
// Hosts allowed: Microsoft Graph and Azure Resource Manager only.
// Output: the response body on STDOUT. A status of 400 or more exits 1 with
// the service's error on STDERR.
// =============================================================================
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OP_HOME = process.env.CONTOSO_OPERATOR_HOME || path.join(os.homedir(), '.contoso-operator');
const KEY_SERVICE = 'contoso-lab-operator-key';
const HOSTS = { 'graph.microsoft.com': 'https://graph.microsoft.com/.default', 'management.azure.com': 'https://management.azure.com/.default' };
const die = (m) => { process.stderr.write(`op-rest: ${m}\n`); process.exit(1); };

export function config() {
  const f = path.join(OP_HOME, 'config');
  if (!fs.existsSync(f)) throw new Error(`no ${f}`);
  const c = Object.fromEntries(fs.readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
  for (const k of ['OP_TENANT_ID', 'OP_CLIENT_ID']) if (!c[k]) throw new Error(`${k} missing from ${f}`);
  return c;
}
function privateKey() {
  const b64 = process.platform === 'win32'
    ? execFileSync(process.env.CONTOSO_PYTHON || 'python', ['-I', path.resolve(HERE, '../demo/signin/wincred.py'), 'read', KEY_SERVICE], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] })
    : execFileSync('security', ['find-generic-password', '-s', KEY_SERVICE, '-w'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return crypto.createPrivateKey(Buffer.from(b64.trim(), 'base64').toString('utf8'));
}
// A token for one scope, as the operator (certificate credential, RFC 7523).
export async function operatorToken(scope, c = config()) {
  const cert = new crypto.X509Certificate(fs.readFileSync(path.join(OP_HOME, 'operator.crt'), 'utf8'));
  if (Date.parse(cert.validTo) < Date.now()) throw new Error('the operator certificate has expired');
  const aud = `https://login.microsoftonline.com/${c.OP_TENANT_ID}/oauth2/v2.0/token`;
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = b({ alg: 'RS256', typ: 'JWT', x5t: crypto.createHash('sha1').update(cert.raw).digest('base64url') });
  const body = b({ aud, iss: c.OP_CLIENT_ID, sub: c.OP_CLIENT_ID, jti: crypto.randomUUID(), nbf: now - 60, exp: now + 300 });
  const assertion = `${head}.${body}.${crypto.sign('RSA-SHA256', Buffer.from(`${head}.${body}`), privateKey()).toString('base64url')}`;
  const r = await fetch(aud, { method: 'POST', body: new URLSearchParams({ grant_type: 'client_credentials', client_id: c.OP_CLIENT_ID, scope,
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer', client_assertion: assertion }) });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error(`operator sign-in failed: ${j.error || r.status} ${String(j.error_description || '').split('\n')[0]}`);
  return j.access_token;
}
export async function rest(method, url, body) {
  const scope = HOSTS[new URL(url).host];
  if (!scope) throw new Error(`host not allowed: ${new URL(url).host}`);
  const r = await fetch(url, { method, headers: { authorization: `Bearer ${await operatorToken(scope)}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, body });
  return { status: r.status, text: await r.text() };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
  const method = (arg('--method') || 'GET').toUpperCase();
  const url = arg('--url');
  if (!url) die('usage: op-rest.mjs --method GET|POST|PATCH|PUT|DELETE --url <https url> [--body-stdin]');
  try {
    const body = process.argv.includes('--body-stdin') ? fs.readFileSync(0, 'utf8') : undefined;
    const r = await rest(method, url, body);
    if (r.status >= 400) die(`${method} ${url.replace(/\?.*$/, '')} -> ${r.status}: ${r.text.slice(0, 600)}`);
    process.stdout.write(r.text);
  } catch (e) { die(e.message); }
}
