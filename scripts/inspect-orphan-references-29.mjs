// scripts/inspect-orphan-references-29.mjs
// Verifica se os orfaos de product_sizes tem referencias em product_prices/product_variants.
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }

const body = JSON.stringify({
  query: `
    SELECT
      (SELECT COUNT(*)::int FROM public.product_prices pp
         WHERE pp.product_size_id IN (
           SELECT ps.id FROM public.product_sizes ps
           LEFT JOIN public.products p ON p.id = ps.product_id
           WHERE p.id IS NULL
         )
      ) AS orphan_prices,
      (SELECT COUNT(*)::int FROM public.product_variants pv
         WHERE pv.product_size_id IN (
           SELECT ps.id FROM public.product_sizes ps
           LEFT JOIN public.products p ON p.id = ps.product_id
           WHERE p.id IS NULL
         )
      ) AS orphan_variants;
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
    console.log(data);
  });
});
req.on('error', (e) => { console.error('REQ ERROR', e.message); });
req.write(body);
req.end();
