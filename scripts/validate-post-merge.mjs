// scripts/validate-post-merge.mjs
// Validacao pos-merge dos PRs #30 e #32 (issue #29 e #31).
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }

const queries = [
  { name: '1) Funcoes SQL presentes', sql: "SELECT proname FROM pg_proc WHERE proname IN ('is_admin','is_super_admin','generate_auto_product_code','generate_auto_variant_code','update_updated_at_column') ORDER BY proname;" },
  { name: '2) Tabelas novas (issue #29)', sql: "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('fabrics','product_fabrics','store_config','product_benefits') ORDER BY tablename;" },
  { name: '3) Novas colunas em products', sql: "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name IN ('slug','meta_title','meta_description','short_description') ORDER BY column_name;" },
  { name: '4) Novas colunas em product_prices', sql: "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='product_prices' AND column_name IN ('pix_price','commercial_line','fabric_id') ORDER BY column_name;" },
  { name: '5) FK product_sizes.product_id', sql: "SELECT conname FROM pg_constraint WHERE conname='product_sizes_product_id_fkey';" },
  { name: '6) store_config (singleton, Jundiai)', sql: "SELECT id, address_locality, address_region, whatsapp_number, email, site_url, pix_discount_percent, warranty FROM public.store_config WHERE id=1;" },
  { name: '7) Tecidos seedados', sql: "SELECT name, commercial_line FROM public.fabrics ORDER BY commercial_line, display_order;" },
  { name: '8) Slugs populados', sql: "SELECT COUNT(*)::int AS total, COUNT(slug)::int AS com_slug FROM public.products;" },
  { name: '9) RLS nas tabelas novas', sql: "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename IN ('fabrics','product_fabrics','store_config','product_benefits') ORDER BY tablename;" }
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
      } catch (e) { console.log(d.substring(0, 600)); }
      next();
    });
  });
  req.on('error', (e) => { console.error('REQ ERROR', e.message); next(); });
  req.write(body);
  req.end();
}
next();
