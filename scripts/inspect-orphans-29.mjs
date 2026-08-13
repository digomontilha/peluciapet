// scripts/inspect-orphans-29.mjs
// Inspeciona registros orfaos em product_sizes (product_id que nao existe em products).
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }

const body = JSON.stringify({
  query: `
    SELECT ps.id, ps.product_id, ps.name, ps.dimensions
    FROM public.product_sizes ps
    LEFT JOIN public.products p ON p.id = ps.product_id
    WHERE p.id IS NULL
    ORDER BY ps.product_id, ps.name;
  `
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
    console.log('ORFAOS EM product_sizes:');
    console.log(data);
  });
});
req.on('error', (e) => { console.error('REQ ERROR', e.message); });
req.write(body);
req.end();
