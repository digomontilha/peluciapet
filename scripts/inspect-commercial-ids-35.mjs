// scripts/inspect-commercial-ids-35.mjs
// Mapeia nomes do spec -> IDs reais de products, product_sizes, fabrics.
// Tambem lista product_fabrics existentes pra evitar duplicar.
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }

const body = JSON.stringify({
  query: `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.slug,
      json_agg(json_build_object('size_id', s.id, 'name', s.name, 'dimensions', s.dimensions) ORDER BY s.display_order) AS sizes,
      (SELECT json_agg(json_build_object('fabric_id', f.id, 'name', f.name, 'commercial_line', f.commercial_line) ORDER BY f.commercial_line, f.display_order) FROM public.fabrics f WHERE f.is_active = true) AS fabrics,
      (SELECT json_agg(json_build_object('fabric_id', pf.fabric_id) ORDER BY pf.fabric_id) FROM public.product_fabrics pf WHERE pf.product_id = p.id) AS existing_fabrics
    FROM public.products p
    LEFT JOIN public.product_sizes s ON s.product_id = p.id
    WHERE p.status = 'active'
    GROUP BY p.id, p.name, p.slug
    ORDER BY p.name;
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
  let d = '';
  res.on('data', (c) => { d += c; });
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try {
      const rows = JSON.parse(d);
      console.log('Produtos encontrados:', rows.length);
      console.log(JSON.stringify(rows, null, 2));
    } catch (e) { console.log(d.substring(0, 1500)); }
  });
});
req.on('error', (e) => { console.error('REQ ERROR', e.message); });
req.write(body);
req.end();
