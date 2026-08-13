// scripts/smoke-test-jornada-35.mjs
// Valida a jornada: pra cada (produto, tamanho, linha com preco), lista tecidos disponiveis.
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }

const queries = [
  {
    name: 'Jornada RoundDream 40x40 Essencial (simulando /produto/caminha-rounddream -> 40x40 -> Essencial)',
    sql: `
      SELECT
        s.name AS size, pp.price, pp.pix_price,
        string_agg(f.name, ', ' ORDER BY f.commercial_line, f.display_order) AS tecidos_disponiveis
      FROM public.product_prices pp
      JOIN public.product_sizes s ON s.id = pp.product_size_id
      JOIN public.products p ON p.id = pp.product_id
      LEFT JOIN public.product_fabrics pf ON pf.product_id = p.id
      LEFT JOIN public.fabrics f ON f.id = pf.fabric_id AND f.commercial_line = pp.commercial_line
      WHERE p.slug = 'caminha-rounddream' AND s.dimensions ILIKE '40%' AND pp.commercial_line = 'essential'
      GROUP BY s.name, pp.price, pp.pix_price;
    `
  },
  {
    name: 'Jornada RoundDream 70x70 Premium',
    sql: `
      SELECT
        s.name AS size, pp.price, pp.pix_price,
        string_agg(f.name, ', ' ORDER BY f.commercial_line, f.display_order) AS tecidos_disponiveis
      FROM public.product_prices pp
      JOIN public.product_sizes s ON s.id = pp.product_size_id
      JOIN public.products p ON p.id = pp.product_id
      LEFT JOIN public.product_fabrics pf ON pf.product_id = p.id
      LEFT JOIN public.fabrics f ON f.id = pf.fabric_id AND f.commercial_line = pp.commercial_line
      WHERE p.slug = 'caminha-rounddream' AND s.dimensions ILIKE '70%' AND pp.commercial_line = 'premium'
      GROUP BY s.name, pp.price, pp.pix_price;
    `
  },
  {
    name: 'Jornada Suede Comfort 60x50 Premium',
    sql: `
      SELECT
        s.name AS size, pp.price, pp.pix_price,
        string_agg(f.name, ', ' ORDER BY f.commercial_line, f.display_order) AS tecidos_disponiveis
      FROM public.product_prices pp
      JOIN public.product_sizes s ON s.id = pp.product_size_id
      JOIN public.products p ON p.id = pp.product_id
      LEFT JOIN public.product_fabrics pf ON pf.product_id = p.id
      LEFT JOIN public.fabrics f ON f.id = pf.fabric_id AND f.commercial_line = pp.commercial_line
      WHERE p.slug = 'caminha-suede-comfort' AND s.dimensions ILIKE '60%' AND pp.commercial_line = 'premium'
      GROUP BY s.name, pp.price, pp.pix_price;
    `
  },
  {
    name: 'Jornada NinhoDream 50x40 (sem preco, mas com tecidos)',
    sql: `
      SELECT
        s.name AS size,
        string_agg(f.name || ' (' || f.commercial_line || ')', ', ' ORDER BY f.commercial_line, f.display_order) AS tecidos_disponiveis,
        (SELECT COUNT(*) FROM public.product_prices WHERE product_id = p.id) AS n_precos_produto
      FROM public.products p
      JOIN public.product_sizes s ON s.id = p.id OR s.product_id = p.id
      LEFT JOIN public.product_fabrics pf ON pf.product_id = p.id
      LEFT JOIN public.fabrics f ON f.id = pf.fabric_id
      WHERE p.slug = 'caminha-ninhodream' AND s.dimensions ILIKE '50x40%'
      GROUP BY p.id, s.name;
    `
  }
];

let i = 0;
function next() {
  if (i >= queries.length) return;
  const q = queries[i++];
  const body = JSON.stringify({ query: q.sql });
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
      console.log('--- ' + q.name + ' [STATUS ' + res.statusCode + '] ---');
      try {
        const parsed = JSON.parse(d);
        if (Array.isArray(parsed) && parsed.length === 0) console.log('  (vazio)');
        else console.log(JSON.stringify(parsed, null, 2));
      } catch (e) { console.log(d.substring(0, 800)); }
      next();
    });
  });
  req.on('error', (e) => { console.error('REQ ERROR', e.message); next(); });
  req.write(body);
  req.end();
}
next();
