// scripts/preview-seed-35.mjs
// Preview detalhado do estado atual das tabelas comerciais, ANTES do seed.
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }

const queries = [
  {
    name: '1) Produtos cadastrados (active)',
    sql: "SELECT id, name, slug, category_id FROM public.products WHERE status='active' ORDER BY name;"
  },
  {
    name: '2) Tamanhos por produto',
    sql: "SELECT p.name AS product, s.name AS size, s.dimensions, s.width_cm, s.height_cm FROM public.product_sizes s JOIN public.products p ON p.id = s.product_id WHERE p.status='active' ORDER BY p.name, s.display_order;"
  },
  {
    name: '3) Precos existentes (commercial_line NULL = nao populado)',
    sql: "SELECT p.name AS product, s.name AS size, pp.commercial_line, pp.price, pp.pix_price FROM public.product_prices pp JOIN public.products p ON p.id = pp.product_id LEFT JOIN public.product_sizes s ON s.id = pp.product_size_id ORDER BY p.name, s.display_order;"
  },
  {
    name: '4) Associacoes produto-tecido (vazio = nao populado)',
    sql: "SELECT p.name AS product, f.name AS fabric, pf.is_available FROM public.product_fabrics pf JOIN public.products p ON p.id = pf.product_id JOIN public.fabrics f ON f.id = pf.fabric_id ORDER BY p.name, f.commercial_line, f.display_order;"
  },
  {
    name: '5) Categorias existentes',
    sql: "SELECT name FROM public.categories ORDER BY name;"
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
