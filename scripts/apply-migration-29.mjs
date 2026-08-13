// scripts/apply-migration-29.mjs
// Lê o arquivo .sql (UTF-8) e envia via Management API.
// Uso: node scripts/apply-migration-29.mjs <caminho-do-sql>
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
const sqlPath = process.argv[2];

if (!PAT) {
  console.error('SUPABASE_PAT não definido no env');
  process.exit(1);
}
if (!sqlPath) {
  console.error('Uso: node scripts/apply-migration-29.mjs <caminho-do-sql>');
  process.exit(1);
}

const absPath = path.resolve(sqlPath);
const sql = fs.readFileSync(absPath, { encoding: 'utf-8' });

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
    if (res.statusCode >= 400) {
      process.exit(1);
    }
  });
});

req.on('error', (e) => { console.error('REQ ERROR', e.message); process.exit(2); });
req.write(body);
req.end();
