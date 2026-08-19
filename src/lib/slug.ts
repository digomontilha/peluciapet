// src/lib/slug.ts
// Utilidade compartilhada para gerar slug a partir de um nome de produto.
// Espelha a logica da funcao SQL public.generate_unique_slug (ver
// supabase/migrations/20260819120000_auto_generate_product_slug.sql):
//   - lowercase
//   - tudo que nao for [a-z0-9] vira '-'
//   - trim de '-' nas pontas
//   - fallback 'produto' quando o resultado for vazio
// A dedup por sufixo '-N' acontece no banco (via trigger/index unico).

export function slugifyProductName(name: string | null | undefined): string {
  const base = (name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'produto';
}
