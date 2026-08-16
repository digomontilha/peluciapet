// scripts/check-og-state.mjs
// Verifica o estado atual da OG image e store_config.og_image_url
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }

const body = JSON.stringify({
  query: "SELECT og_image_url, id, updated_at FROM public.store_config WHERE id = 1;"
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
  let d = '';
  res.on('data', (c) => { d += c; });
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log(d);
  });
});
req.on('error', (e) => { console.error('REQ ERROR', e.message); });
req.write(body);
req.end();
