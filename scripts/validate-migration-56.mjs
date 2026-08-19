// scripts/validate-migration-56.mjs
// Validacao pos-merge da issue #56 (slug automatico em products).
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }

const queries = [
  { name: '1) Funcao generate_unique_slug existe', sql: "SELECT proname FROM pg_proc WHERE proname = 'generate_unique_slug';" },
  { name: '2) Funcao set_product_slug_on_insert existe', sql: "SELECT proname FROM pg_proc WHERE proname = 'set_product_slug_on_insert';" },
  { name: '3) Trigger trg_products_auto_slug existe em products', sql: "SELECT tgname, tgtype FROM pg_trigger WHERE tgname = 'trg_products_auto_slug' AND tgrelid = 'public.products'::regclass;" },
  { name: '4) Coluna slug existe em products', sql: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='slug';" },
  { name: '5) Indice unico em lower(slug) WHERE slug IS NOT NULL', sql: "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='products' AND indexname='idx_products_slug_unique';" },
  { name: '6) Total de produtos com/sem slug', sql: "SELECT COUNT(*)::int AS total, COUNT(slug)::int AS com_slug, COUNT(*) FILTER (WHERE slug IS NULL OR trim(slug) = '')::int AS sem_slug FROM public.products;" },
  { name: '7) Amostra de 5 produtos com slug', sql: "SELECT id, name, slug FROM public.products WHERE slug IS NOT NULL ORDER BY created_at DESC LIMIT 5;" },
  { name: '8) Teste: generate_unique_slug com nome normal', sql: "SELECT public.generate_unique_slug('Caminha Premium para Caes') AS slug;" },
  { name: '9) Teste: generate_unique_slug com acento', sql: "SELECT public.generate_unique_slug('Caminha Coracao para Gato') AS slug;" },
  { name: '10) Teste: generate_unique_slug com nome vazio (fallback)', sql: "SELECT public.generate_unique_slug('') AS slug;" },
  { name: '11) Teste: generate_unique_slug com nome so com especiais', sql: "SELECT public.generate_unique_slug('!!! @@@ ###') AS slug;" },
  { name: '12) Teste: generate_unique_slug dedup (forca colisao com produto existente)', sql: "SELECT public.generate_unique_slug('Caminha Premium para Caes', NULL) AS tentativa_1;" }
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
