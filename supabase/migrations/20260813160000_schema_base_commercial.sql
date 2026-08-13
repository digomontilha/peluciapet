-- =====================================================================
-- Schema base: fabrics, linhas Essencial/Premium, pix_price, slugs,
-- store_config (singleton), product_benefits
-- Issue: #29
-- Idempotente e 100% aditivo (sem DROP TABLE / DROP COLUMN em dados existentes).
-- =====================================================================

-- 0. Garantir pgcrypto (idempotente)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 0.1 Limpar orfaos de product_sizes (product_id que nao existe em products).
--     Sem referencias em product_prices nem product_variants (validado em
--     scripts/inspect-orphan-references-29.mjs). 20 registros: 5 product_ids
--     deletados (4 tamanhos P/M/G/GG cada, deixados pelo ProductForm.tsx).
--     Sem este DELETE o ALTER TABLE ADD CONSTRAINT abaixo falha com 23503.
DELETE FROM public.product_sizes
WHERE product_id NOT IN (SELECT id FROM public.products);

-- =====================================================================
-- 1. fabrics
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.fabrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  commercial_line text NOT NULL CHECK (commercial_line IN ('essential','premium')),
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fabrics_name_line_unique UNIQUE (name, commercial_line)
);

DROP TRIGGER IF EXISTS update_fabrics_updated_at ON public.fabrics;
CREATE TRIGGER update_fabrics_updated_at
  BEFORE UPDATE ON public.fabrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read fabrics" ON public.fabrics;
CREATE POLICY "Public read fabrics"
  ON public.fabrics FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin manage fabrics" ON public.fabrics;
CREATE POLICY "Admin manage fabrics"
  ON public.fabrics FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================================
-- 2. product_fabrics (N:N produto <-> tecido)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.product_fabrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  fabric_id uuid NOT NULL REFERENCES public.fabrics(id) ON DELETE RESTRICT,
  is_available boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_fabrics_unique UNIQUE (product_id, fabric_id)
);

CREATE INDEX IF NOT EXISTS idx_product_fabrics_product_id
  ON public.product_fabrics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_fabrics_fabric_id
  ON public.product_fabrics(fabric_id);

ALTER TABLE public.product_fabrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read product_fabrics" ON public.product_fabrics;
CREATE POLICY "Public read product_fabrics"
  ON public.product_fabrics FOR SELECT
  USING (is_available = true);

DROP POLICY IF EXISTS "Admin manage product_fabrics" ON public.product_fabrics;
CREATE POLICY "Admin manage product_fabrics"
  ON public.product_fabrics FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================================
-- 3. store_config (singleton: id sempre = 1)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.store_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  whatsapp_number text NOT NULL DEFAULT '5511937413939',
  whatsapp_display text NOT NULL DEFAULT '(11) 93741-3939',
  email text NOT NULL DEFAULT 'contato@peluciapet.com.br',
  instagram_url text NULL,
  production_time text NOT NULL DEFAULT '5 dias úteis',
  shipping_time text NOT NULL DEFAULT '5 dias úteis',
  warranty text NOT NULL DEFAULT '30 dias',
  pix_discount_percent integer NOT NULL DEFAULT 5
    CHECK (pix_discount_percent BETWEEN 0 AND 50),
  payment_methods text[] NOT NULL DEFAULT ARRAY['pix'],
  address_locality text NULL DEFAULT 'São Paulo',
  address_region text NULL DEFAULT 'SP',
  address_country text NOT NULL DEFAULT 'BR',
  site_url text NOT NULL DEFAULT 'https://peluciapet.com.br',
  og_image_url text NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_store_config_updated_at ON public.store_config;
CREATE TRIGGER update_store_config_updated_at
  BEFORE UPDATE ON public.store_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read store_config" ON public.store_config;
CREATE POLICY "Public read store_config"
  ON public.store_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Super admin manage store_config" ON public.store_config;
CREATE POLICY "Super admin manage store_config"
  ON public.store_config FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Seed singleton (idempotente)
INSERT INTO public.store_config (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- 4. product_benefits (N:N produto <-> beneficio, com copy admin)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.product_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NULL,
  icon_name text NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_benefits_product_id
  ON public.product_benefits(product_id);

ALTER TABLE public.product_benefits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read product_benefits" ON public.product_benefits;
CREATE POLICY "Public read product_benefits"
  ON public.product_benefits FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin manage product_benefits" ON public.product_benefits;
CREATE POLICY "Admin manage product_benefits"
  ON public.product_benefits FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================================
-- 5. products: novas colunas (todas NULLable, sem default destrutivo)
-- =====================================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug text NULL,
  ADD COLUMN IF NOT EXISTS meta_title text NULL,
  ADD COLUMN IF NOT EXISTS meta_description text NULL,
  ADD COLUMN IF NOT EXISTS short_description text NULL;

-- Slug unico (case-insensitive) entre os nao-nulos
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique
  ON public.products(lower(slug))
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_slug_lookup
  ON public.products(slug)
  WHERE slug IS NOT NULL;

-- Backfill: gera slug a partir do name, lower-kebab, com dedup por sufixo
DO $$
DECLARE
  r record;
  base_slug text;
  new_slug text;
  counter integer;
BEGIN
  FOR r IN SELECT id, name FROM public.products WHERE slug IS NULL LOOP
    base_slug := lower(regexp_replace(coalesce(r.name, ''), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    IF base_slug = '' THEN
      base_slug := 'produto';
    END IF;
    new_slug := base_slug;
    counter := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.products
      WHERE lower(slug) = lower(new_slug) AND id <> r.id
    ) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter::text;
    END LOOP;
    UPDATE public.products SET slug = new_slug WHERE id = r.id;
  END LOOP;
END $$;

-- =====================================================================
-- 6. product_prices: pix_price, commercial_line, fabric_id
-- =====================================================================
ALTER TABLE public.product_prices
  ADD COLUMN IF NOT EXISTS pix_price numeric(10,2) NULL,
  ADD COLUMN IF NOT EXISTS commercial_line text NULL
    CHECK (commercial_line IN ('essential','premium')),
  ADD COLUMN IF NOT EXISTS fabric_id uuid NULL
    REFERENCES public.fabrics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_product_prices_line
  ON public.product_prices(product_id, commercial_line);

CREATE INDEX IF NOT EXISTS idx_product_prices_fabric
  ON public.product_prices(fabric_id)
  WHERE fabric_id IS NOT NULL;

-- UNIQUE constraint (product_id, product_size_id, commercial_line) — idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_prices_unique_size_line'
  ) THEN
    ALTER TABLE public.product_prices
      ADD CONSTRAINT product_prices_unique_size_line
      UNIQUE (product_id, product_size_id, commercial_line);
  END IF;
END $$;

-- =====================================================================
-- 7. product_variants: fabric_id opcional (se estoque/disponibilidade
--    variar por tecido)
-- =====================================================================
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS fabric_id uuid NULL
    REFERENCES public.fabrics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_fabric_id
  ON public.product_variants(fabric_id)
  WHERE fabric_id IS NOT NULL;

-- =====================================================================
-- 8. product_sizes: corrige FK faltante (worker B detectou inconsistencia)
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_sizes_product_id_fkey'
  ) THEN
    ALTER TABLE public.product_sizes
      ADD CONSTRAINT product_sizes_product_id_fkey
      FOREIGN KEY (product_id)
      REFERENCES public.products(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- =====================================================================
-- 9. Seed tecidos (idempotente via UNIQUE (name, commercial_line))
-- =====================================================================
INSERT INTO public.fabrics (name, commercial_line, description, display_order) VALUES
  ('Oxford',          'essential', 'Tecido resistente, ótimo para o dia a dia.',                       10),
  ('Tricoline',       'essential', 'Algodão encorpado, confortável e durável.',                       20),
  ('Tricoline Toca',  'essential', 'Tricoline com capuz/toca embutida para pets que se escondem.',    30),
  ('Fleece',          'premium',   'Peluciado macio e quentinho, ideal para dias frios.',             10),
  ('Plush',           'premium',   'Pelúcia extra macia, toque aveludado.',                           20),
  ('Carpete',         'premium',   'Carpete peluciado premium, alta durabilidade.',                   30)
ON CONFLICT (name, commercial_line) DO NOTHING;

-- =====================================================================
-- Fim. Sem DROP TABLE, sem DROP COLUMN em dados existentes.
-- =====================================================================
