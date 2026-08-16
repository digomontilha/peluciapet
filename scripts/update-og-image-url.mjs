// scripts/update-og-image-url.mjs
// Atualiza store_config.og_image_url no Supabase via Management API.
// Token vem de SUPABASE_PAT em env (NUNCA persistido).
const ref = 'eogzmfpioypmrcbjnvtd';
const url = `https://api.supabase.com/v1/projects/${ref}/database/query`;
const token = process.env.SUPABASE_PAT;
if (!token) {
  console.error('SUPABASE_PAT nao definido');
  process.exit(1);
}

const sql = "UPDATE public.store_config SET og_image_url = 'https://peluciapet.com.br/og-image.png', updated_at = NOW() WHERE id = 1 RETURNING id, og_image_url, updated_at;";

const body = JSON.stringify({ query: sql });

const req = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'apikey': token,
  },
  body,
});

const text = await req.text();
console.log('Status:', req.status);
console.log('Response:', text);

if (req.status !== 200 && req.status !== 201) {
  process.exit(1);
}
