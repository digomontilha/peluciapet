-- =====================================================================
-- Auto-geracao de slug em products + backfill idempotente
-- Issue: #56
-- Corrige: produtos cadastrados depois da migration #29 (schema base)
--          nao recebiam slug, e a pagina de detalhes (/produto/:slug)
--          nao abria (Produto nao encontrado).
--
-- Estrategias (todas idempotentes):
--   1) Funcao generate_unique_slug(p_name text, p_existing_id uuid)
--      - normaliza (lowercase, kebab, trim '-', fallback 'produto')
--      - dedup por sufixo '-N' consultando produtos existentes
--   2) Trigger BEFORE INSERT em products: se NEW.slug for NULL/blank,
--      preenche a partir de NEW.name via generate_unique_slug
--   3) Backfill: preenche slug em produtos existentes com slug IS NULL
--      (nao sobrescreve slugs ja definidos)
-- =====================================================================

-- 1) Funcao: gera slug unico a partir de um nome
CREATE OR REPLACE FUNCTION public.generate_unique_slug(
  p_name text,
  p_existing_id uuid DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  new_slug  text;
  counter   integer;
BEGIN
  -- Normaliza: tudo que nao for [a-z0-9] vira '-'; trim tira '-' das pontas
  base_slug := lower(regexp_replace(coalesce(p_name, ''), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  -- Fallback quando o nome so tem caracteres especiais
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'produto';
  END IF;

  -- Dedup: se ja existe (em OUTRA linha) com mesmo slug, sufixa -2, -3, ...
  new_slug := base_slug;
  counter  := 1;
  WHILE EXISTS (
    SELECT 1
    FROM public.products p
    WHERE lower(p.slug) = lower(new_slug)
      AND (p_existing_id IS NULL OR p.id <> p_existing_id)
  ) LOOP
    counter   := counter + 1;
    new_slug  := base_slug || '-' || counter::text;
  END LOOP;

  RETURN new_slug;
END;
$$;

-- 2) Funcao de trigger: BEFORE INSERT — preenche slug se vier em branco
CREATE OR REPLACE FUNCTION public.set_product_slug_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
    NEW.slug := public.generate_unique_slug(NEW.name, NULL);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger propriamente dito (DROP + CREATE idempotente)
DROP TRIGGER IF EXISTS trg_products_auto_slug ON public.products;
CREATE TRIGGER trg_products_auto_slug
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_slug_on_insert();

-- 3) Backfill idempotente: preenche slug em produtos existentes sem slug
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id, name
    FROM public.products
    WHERE slug IS NULL OR trim(slug) = ''
  LOOP
    UPDATE public.products
       SET slug = public.generate_unique_slug(r.name, r.id)
     WHERE id = r.id;
  END LOOP;
END $$;
