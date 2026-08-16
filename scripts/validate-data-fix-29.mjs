// scripts/validate-data-fix-29.mjs
// Confere que store_config.address_locality = 'Jundiaí'.
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }

const body = JSON.stringify({
  query: `SELECT id, address_locality, address_region, address_country, site_url FROM public.store_config WHERE id = 1;`
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
    console.log(data);
  });
});
req.on('error', (e) => { console.error('REQ ERROR', e.message); });
req.write(body);
req.end();
