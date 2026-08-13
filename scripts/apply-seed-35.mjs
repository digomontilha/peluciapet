// scripts/apply-seed-35.mjs
// Aplica o seed comercial via Management API num unico POST (transacao atomica).
// Uso: SUPABASE_PAT=... node scripts/apply-seed-35.mjs supabase/migrations/20260813220000_seed_commercial_prices.sql
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
const sqlPath = process.argv[2];

if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }
if (!sqlPath) { console.error('Uso: node scripts/apply-seed-35.mjs <caminho-do-sql>'); process.exit(1); }

const sql = fs.readFileSync(path.resolve(sqlPath), { encoding: 'utf-8' });
const body = JSON.stringify({ query: sql });
const opts = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + PAT,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(opts, (res) => {
  let d = '';
  res.on('data', (c) => { d += c; });
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY ', d);
    if (res.statusCode >= 400) process.exit(1);
  });
});
req.on('error', (e) => { console.error('REQ ERROR', e.message); process.exit(2); });
req.write(body);
req.end();
