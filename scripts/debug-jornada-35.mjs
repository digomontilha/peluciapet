// scripts/debug-jornada-35.mjs
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }

const body = JSON.stringify({
  query: `
    SELECT
      p.id, encode(p.name::bytea, 'escape') AS name_bytes, p.name,
      count(pp.id) AS n_prices, count(pf.fabric_id) AS n_fabrics
    FROM public.products p
    LEFT JOIN public.product_prices pp ON pp.product_id = p.id
    LEFT JOIN public.product_fabrics pf ON pf.product_id = p.id
    WHERE p.slug IN ('caminha-rounddream', 'caminha-suede-comfort')
    GROUP BY p.id, p.name
    ORDER BY p.name;
  `
});

const opts = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + PAT, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
};

const req = https.request(opts, (res) => {
  let d = '';
  res.on('data', (c) => { d += c; });
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try {
      console.log(JSON.stringify(JSON.parse(d), null, 2));
    } catch (e) { console.log(d.substring(0, 1000)); }
  });
});
req.on('error', (e) => { console.error('REQ ERROR', e.message); });
req.write(body);
req.end();
