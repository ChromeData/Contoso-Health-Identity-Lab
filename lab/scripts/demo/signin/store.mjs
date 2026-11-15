// =============================================================================
// lab/scripts/demo/signin/store.mjs - the Windows side of the sign-in toolkit
// -----------------------------------------------------------------------------
// The toolkit was written on a Mac: secrets in the login Keychain (`security`)
// and Graph through the operator's shell wrapper (`op az rest`). A Windows PC
// has neither. This module gives the same three secret calls and the same
// Graph call on Windows:
//   * secrets: Windows Credential Manager, through wincred.py (standard
//     library Python; the secret travels on STDIN / STDOUT, never in argv)
//   * Graph: lab/scripts/operator/op-rest.mjs, which signs in as the same lab
//     operator with the same certificate (no az CLI, no bash)
// On a Mac nothing here runs: lib.mjs and passkey.mjs call this only when
// WIN is true, so the Keychain path is unchanged.
// =============================================================================
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const WIN = process.platform === 'win32';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PYTHON = process.env.CONTOSO_PYTHON || 'python';
const WINCRED = path.join(HERE, 'wincred.py');
export const OP_REST = path.resolve(HERE, '../../operator/op-rest.mjs');
const NOT_FOUND = 44;

function wincred(args, input) {
  return execFileSync(PYTHON, ['-I', WINCRED, ...args], { input, encoding: 'utf8', windowsHide: true, stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'ignore'] });
}
// Null = no such item. Any other failure throws (fail closed, as on the Mac).
export function winRead(service, account) {
  try { return wincred(['read', service, ...(account ? [account] : [])]); } catch (e) {
    if (e.status === NOT_FOUND) return null;
    throw new Error(`Credential Manager read failed (exit ${e.status}) for ${service}`);
  }
}
export function winWrite(service, account, secret) {
  if (!secret) throw new Error('winWrite: no value');
  try { wincred(['write', service, account], secret); } catch (e) { throw new Error(`Credential Manager write to ${service} failed (exit ${e.status})`); }
  if (winRead(service, account) !== secret) throw new Error(`Credential Manager write to ${service} did not read back`);
}
// True = deleted, false = it was not there.
export function winDelete(service, account) {
  try { wincred(['delete', service, ...(account ? [account] : [])]); return true; } catch (e) {
    if (e.status === NOT_FOUND) return false;
    throw new Error(`Credential Manager delete failed (exit ${e.status}) for ${service}`);
  }
}

// One REST call as the lab operator. The body goes on STDIN. Returns the
// response text ('' when there is none); a failed call throws with the
// service's own error text, which never holds a secret.
export function winRest(method, url, body) {
  const input = body === undefined ? undefined : JSON.stringify(body);
  return execFileSync(process.execPath, [OP_REST, '--method', method, '--url', url, ...(input === undefined ? [] : ['--body-stdin'])],
    { input, encoding: 'utf8', windowsHide: true, stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'], maxBuffer: 32 << 20 });
}
