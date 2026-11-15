#!/usr/bin/env node
// =============================================================================
// query-as-operator.mjs - read one Log Analytics table AS THE LAB OPERATOR and
// write the rows in the form `ingest-from-loganalytics.sh --input-json` reads.
// -----------------------------------------------------------------------------
//   node lab/splunk/query-as-operator.mjs AuditLogs P14D out.json
//   ./ingest-from-loganalytics.sh -T AuditLogs --input-json out.json
//
// WHY: a Windows PC has no az CLI, so the replay's own query step
// (`az monitor log-analytics query`) cannot run there. This does that one
// step with the operator's certificate (lab/scripts/operator/op-rest.mjs: the
// key stays in the machine's secret store) and the Azure Monitor Logs query
// API. The KQL is the replay's own (kql_for in ingest-from-loganalytics.sh),
// so the rows and their LaIngestionTime column are the same.
//
// READ ONLY. STAND-IN: the same replay path the README names (Log Analytics ->
// HEC in place of Event Hub -> the Splunk add-on).
// The output file holds real tenant log rows: keep it out of git (write it
// under lab/splunk/.state/, which is ignored) and delete it after the replay.
// A result that Log Analytics marks partial is refused whole.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [table, timespan = 'PT24H', out] = process.argv.slice(2);
const die = (m) => { process.stderr.write(`query-as-operator: ${m}\n`); process.exit(1); };
if (!table || !out || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(table) || !/^P(\d+D)?(T(\d+H)?(\d+M)?)?$/.test(timespan)) {
  die('usage: query-as-operator.mjs <Table> <ISO-8601 duration, for example P14D or PT24H> <output file>');
}
const SUB = process.env.LA_SUBSCRIPTION_ID || 'de0b2a93-1c62-47b3-aaaf-1bdd1939a274';
const RG = process.env.LA_RESOURCE_GROUP || 'rg-identity-lab';
const WS = process.env.LA_WORKSPACE_NAME || 'loga-idlab';

try {
  const op = await import(pathToFileURL(path.resolve(HERE, '../scripts/operator/op-rest.mjs')).href);
  const ws = await op.rest('GET', `https://management.azure.com/subscriptions/${SUB}/resourceGroups/${RG}/providers/Microsoft.OperationalInsights/workspaces/${WS}?api-version=2023-09-01`);
  if (ws.status >= 400) die(`workspace ${WS}: HTTP ${ws.status} ${ws.text.slice(0, 200)}`);
  const id = JSON.parse(ws.text).properties?.customerId;
  if (!/^[0-9a-f-]{36}$/i.test(id || '')) die(`workspace ${WS}: no customer id`);
  const query = `${table}\n| extend LaIngestionTime = ingestion_time()\n| order by LaIngestionTime asc\n| project Row = tostring(pack_all(true))`;
  const token = await op.operatorToken('https://api.loganalytics.io/.default');
  const r = await fetch(`https://api.loganalytics.io/v1/workspaces/${id}/query`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ query, timespan }) });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j) die(`${table}: query failed: HTTP ${r.status} ${JSON.stringify(j?.error || {}).slice(0, 300)}`);
  if (j.error) die(`${table}: Log Analytics marked the result partial: nothing written`);
  const t = (j.tables || [])[0];
  const k = t?.columns?.findIndex((c) => c.name === 'Row');
  if (!t || k < 0) die(`${table}: the result has no Row column`);
  const rows = t.rows.map((x) => ({ Row: x[k] }));
  fs.writeFileSync(out, JSON.stringify(rows));
  process.stdout.write(`${table}: ${rows.length} rows (${timespan}) -> ${out}\n`);
} catch (e) { die(e.message.split('\n')[0]); }
