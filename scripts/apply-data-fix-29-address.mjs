// scripts/apply-data-fix-29-address.mjs
// Aplica UPDATE em store_config com endereco real (Jundiai - SP).
// Acompanha a migration 20260813170000_fix_store_config_address.sql.
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
const sqlPath = process.argv[2];

if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }
if (!sqlPath) { console.error('Uso: node scripts/apply-data-fix-29-address.mjs <caminho-do-sql>'); process.exit(1); }

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
  let data = '';
  res.on('data', (c) => { data += c; });
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY ', data);
    if (res.statusCode >= 400) process.exit(1);
  });
});
req.on('error', (e) => { console.error('REQ ERROR', e.message); process.exit(2); });
req.write(body);
req.end();
