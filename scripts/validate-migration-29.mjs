// scripts/validate-migration-29.mjs
// Validacao pos-migration #29.
import https from 'node:https';

const PROJECT_REF = 'eogzmfpioypmrcbjnvtd';
const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('SUPABASE_PAT nao definido'); process.exit(1); }

const queries = [
  {
    name: '1) Tabelas novas existem',
    sql: `SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name IN ('fabrics','product_fabrics','store_config','product_benefits')
          ORDER BY table_name;`
  },
  {
    name: '2) Novas colunas em products',
    sql: `SELECT column_name, data_type FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'products'
          AND column_name IN ('slug','meta_title','meta_description','short_description')
          ORDER BY column_name;`
  },
  {
    name: '3) Novas colunas em product_prices',
    sql: `SELECT column_name, data_type, is_nullable FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'product_prices'
          AND column_name IN ('pix_price','commercial_line','fabric_id')
          ORDER BY column_name;`
  },
  {
    name: '4) Nova coluna em product_variants',
    sql: `SELECT column_name, data_type, is_nullable FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'product_variants'
          AND column_name = 'fabric_id';`
  },
  {
    name: '5) FK faltante em product_sizes existe agora',
    sql: `SELECT conname FROM pg_constraint
          WHERE conname = 'product_sizes_product_id_fkey';`
  },
  {
    name: '6) UNIQUE constraint nova em product_prices',
    sql: `SELECT conname FROM pg_constraint
          WHERE conname = 'product_prices_unique_size_line';`
  },
  {
    name: '7) RLS habilitado nas tabelas novas',
    sql: `SELECT tablename, rowsecurity FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename IN ('fabrics','product_fabrics','store_config','product_benefits')
          ORDER BY tablename;`
  },
  {
    name: '8) Seed de tecidos',
    sql: `SELECT name, commercial_line, is_active, display_order
          FROM public.fabrics ORDER BY commercial_line, display_order;`
  },
  {
    name: '9) Seed de store_config (singleton)',
    sql: `SELECT id, whatsapp_number, whatsapp_display, email, site_url,
                 pix_discount_percent, payment_methods, warranty
          FROM public.store_config WHERE id = 1;`
  },
  {
    name: '10) Backfill de slugs em products',
    sql: `SELECT COUNT(*)::int AS total,
                 COUNT(slug)::int AS com_slug,
                 COUNT(*) FILTER (WHERE slug IS NULL)::int AS sem_slug
          FROM public.products;`
  },
  {
    name: '11) Listar produtos com slug gerado',
    sql: `SELECT name, slug FROM public.products ORDER BY name;`
  },
  {
    name: '12) Triggers de updated_at ativos',
    sql: `SELECT event_object_table, trigger_name
          FROM information_schema.triggers
          WHERE event_object_schema = 'public'
          AND trigger_name IN ('update_fabrics_updated_at','update_store_config_updated_at')
          ORDER BY trigger_name;`
  },
  {
    name: '13) Policies public read em fabrics',
    sql: `SELECT polname, polcmd FROM pg_policy
          WHERE polrelid = 'public.fabrics'::regclass
          ORDER BY polname;`
  }
];

function runOne(q, done) {
  const body = JSON.stringify({ query: q.sql });
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
      console.log('--- ' + q.name + ' [STATUS ' + res.statusCode + '] ---');
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length === 0) {
          console.log('  (vazio)');
        } else {
          console.log(JSON.stringify(parsed, null, 2));
        }
      } catch (e) {
        console.log(data.substring(0, 800));
      }
      done();
    });
  });
  req.on('error', (e) => { console.error('REQ ERROR', e.message); done(); });
  req.write(body);
  req.end();
}

let i = 0;
function next() {
  if (i >= queries.length) return;
  runOne(queries[i++], next);
}
next();
