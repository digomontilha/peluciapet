// Standalone script template for executing SQL against the PelúciaPet
// Supabase project via the Management API. The PAT must be supplied at
// runtime (env var, stdin, or wrapper script) — never hard-code it here.
// Usage:
//   SUPABASE_PAT=... node .tmp/recreate-personalizados.cjs
const https = require('https');

const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_PROJECT_REF || 'eogzmfpioypmrcbjnvtd';

if (!PAT) {
  console.error('Set SUPABASE_PAT before running.');
  process.exit(1);
}

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request(
      {
        hostname: 'api.supabase.com',
        path: '/v1/projects/' + REF + '/database/query',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + PAT,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  const queries = [
    ["count", 'SELECT count(*)::int AS total FROM public.categories;'],
    ["list", 'SELECT name, icon FROM public.categories ORDER BY name;'],
  ];
  for (const [label, sql] of queries) {
    const r = await runQuery(sql);
    console.log(`--- ${label} (${r.status}) ---`);
    console.log(r.body);
  }
})();
