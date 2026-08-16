// scripts/test-pat.mjs — apenas teste de conexão.
// Roda: node scripts/test-pat.mjs
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;

if (!PAT) {
  console.error('SUPABASE_PAT não definido no env');
  process.exit(1);
}

const body = JSON.stringify({
  query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('fabrics','product_fabrics','store_config','product_benefits','product_prices','products','product_sizes') ORDER BY table_name;"
});

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
    console.log('BODY', data.substring(0, 800));
  });
});

req.on('error', (e) => { console.error('REQ ERROR', e.message); });
req.write(body);
req.end();
