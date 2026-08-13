// scripts/validate-seed-35.mjs
// Validacao pos-apply do seed #35.
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }

const queries = [
  {
    name: '1) Total de precos com commercial_line populado (esperado: 14)',
    sql: "SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE commercial_line IS NOT NULL)::int AS com_linha, COUNT(*) FILTER (WHERE commercial_line IS NULL)::int AS sem_linha FROM public.product_prices;"
  },
  {
    name: '2) Precos por (produto, linha)',
    sql: "SELECT p.name AS product, pp.commercial_line, COUNT(*)::int AS n_precos, MIN(pp.price)::text || ' - ' || MAX(pp.price)::text AS faixa_preco FROM public.product_prices pp JOIN public.products p ON p.id = pp.product_id GROUP BY p.name, pp.commercial_line ORDER BY p.name, pp.commercial_line;"
  },
  {
    name: '3) Total de product_fabrics (esperado: 30)',
    sql: "SELECT COUNT(*)::int AS total FROM public.product_fabrics;"
  },
  {
    name: '4) Tecidos por produto',
    sql: "SELECT p.name AS product, COUNT(*)::int AS n_tecidos, string_agg(f.name, ', ' ORDER BY f.commercial_line, f.display_order) AS tecidos FROM public.product_fabrics pf JOIN public.products p ON p.id = pf.product_id JOIN public.fabrics f ON f.id = pf.fabric_id GROUP BY p.name ORDER BY p.name;"
  },
  {
    name: '5) REDONDA - 8 precos RoundDream',
    sql: "SELECT s.name AS size, pp.commercial_line, pp.price, pp.pix_price FROM public.product_prices pp JOIN public.products p ON p.id = pp.product_id JOIN public.product_sizes s ON s.id = pp.product_size_id WHERE p.name = 'Caminha RoundDream' ORDER BY s.display_order, pp.commercial_line;"
  },
  {
    name: '6) RETANGULAR - 6 precos Suede Comfort',
    sql: "SELECT s.name AS size, pp.commercial_line, pp.price, pp.pix_price FROM public.product_prices pp JOIN public.products p ON p.id = pp.product_id JOIN public.product_sizes s ON s.id = pp.product_size_id WHERE p.name = 'Caminha Suede Comfort' ORDER BY s.display_order, pp.commercial_line;"
  },
  {
    name: '7) Produtos SEM preco (esperado: 4 retangulares)',
    sql: "SELECT p.name, COUNT(pp.id)::int AS n_precos FROM public.products p LEFT JOIN public.product_prices pp ON pp.product_id = p.id GROUP BY p.name ORDER BY p.name;"
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
