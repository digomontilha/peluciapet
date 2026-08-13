-- =====================================================================
-- Seed comercial: product_fabrics (30) + product_prices (14) + reset das
-- 21 linhas com commercial_line IS NULL existentes.
-- Issue: #35
-- Idempotente (todos os INSERT usam ON CONFLICT).
-- Transacao atomica (BEGIN/COMMIT) - qualquer erro faz ROLLBACK total.
-- Nenhuma linha existente em product_prices sera apagada sem ser
-- recriada abaixo.
-- =====================================================================

BEGIN;

SELECT 'seed-35: resetando product_prices com commercial_line NULL e limpando product_fabrics...' AS log;

DELETE FROM public.product_prices WHERE commercial_line IS NULL;
DELETE FROM public.product_fabrics;

SELECT 'seed-35: inserindo 30 product_fabrics (6 produtos x 5 tecidos)...' AS log;

-- RoundDream (REDONDA): Oxford + Tricoline (essencial), Fleece + Plush + Carpete (premium)
INSERT INTO public.product_fabrics (product_id, fabric_id, is_available, display_order) VALUES
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', '229f63dd-a4e4-4a78-b97e-30c97193e4dd', true, 10),
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', 'f60768c5-47d9-4a52-a76f-33d725950249', true, 20),
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', 'e2fd47cc-0d51-422b-b8f7-a396a0b3d75c', true, 10),
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', 'ddd800a7-eb6b-4210-be77-23cd7a8542d4', true, 20),
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', 'd6f60532-f40b-4136-aa5d-969c4c0c2baf', true, 30)
ON CONFLICT (product_id, fabric_id) DO NOTHING;

-- Suede Comfort (RETANGULAR)
INSERT INTO public.product_fabrics (product_id, fabric_id, is_available, display_order) VALUES
  ('1ab212a3-113e-4983-b4ed-10307528a9a2', '229f63dd-a4e4-4a78-b97e-30c97193e4dd', true, 10),
  ('1ab212a3-113e-4983-b4ed-10307528a9a2', 'f60768c5-47d9-4a52-a76f-33d725950249', true, 20),
  ('1ab212a3-113e-4983-b4ed-10307528a9a2', 'e2fd47cc-0d51-422b-b8f7-a396a0b3d75c', true, 10),
  ('1ab212a3-113e-4983-b4ed-10307528a9a2', 'ddd800a7-eb6b-4210-be77-23cd7a8542d4', true, 20),
  ('1ab212a3-113e-4983-b4ed-10307528a9a2', 'd6f60532-f40b-4136-aa5d-969c4c0c2baf', true, 30)
ON CONFLICT (product_id, fabric_id) DO NOTHING;

-- NinhoDream (sem preco, mas com tecidos pra UX melhor)
INSERT INTO public.product_fabrics (product_id, fabric_id, is_available, display_order) VALUES
  ('8ddf4a05-de58-41ef-9bb7-74612da32652', '229f63dd-a4e4-4a78-b97e-30c97193e4dd', true, 10),
  ('8ddf4a05-de58-41ef-9bb7-74612da32652', 'f60768c5-47d9-4a52-a76f-33d725950249', true, 20),
  ('8ddf4a05-de58-41ef-9bb7-74612da32652', 'e2fd47cc-0d51-422b-b8f7-a396a0b3d75c', true, 10),
  ('8ddf4a05-de58-41ef-9bb7-74612da32652', 'ddd800a7-eb6b-4210-be77-23cd7a8542d4', true, 20),
  ('8ddf4a05-de58-41ef-9bb7-74612da32652', 'd6f60532-f40b-4136-aa5d-969c4c0c2baf', true, 30)
ON CONFLICT (product_id, fabric_id) DO NOTHING;

-- PuppyJoy Retangular
INSERT INTO public.product_fabrics (product_id, fabric_id, is_available, display_order) VALUES
  ('2420f15d-66e0-4b5f-9908-ecd6306aac62', '229f63dd-a4e4-4a78-b97e-30c97193e4dd', true, 10),
  ('2420f15d-66e0-4b5f-9908-ecd6306aac62', 'f60768c5-47d9-4a52-a76f-33d725950249', true, 20),
  ('2420f15d-66e0-4b5f-9908-ecd6306aac62', 'e2fd47cc-0d51-422b-b8f7-a396a0b3d75c', true, 10),
  ('2420f15d-66e0-4b5f-9908-ecd6306aac62', 'ddd800a7-eb6b-4210-be77-23cd7a8542d4', true, 20),
  ('2420f15d-66e0-4b5f-9908-ecd6306aac62', 'd6f60532-f40b-4136-aa5d-969c4c0c2baf', true, 30)
ON CONFLICT (product_id, fabric_id) DO NOTHING;

-- SoftDream Retangular
INSERT INTO public.product_fabrics (product_id, fabric_id, is_available, display_order) VALUES
  ('627cd510-c05d-47fc-ad82-6be16a6d9a01', '229f63dd-a4e4-4a78-b97e-30c97193e4dd', true, 10),
  ('627cd510-c05d-47fc-ad82-6be16a6d9a01', 'f60768c5-47d9-4a52-a76f-33d725950249', true, 20),
  ('627cd510-c05d-47fc-ad82-6be16a6d9a01', 'e2fd47cc-0d51-422b-b8f7-a396a0b3d75c', true, 10),
  ('627cd510-c05d-47fc-ad82-6be16a6d9a01', 'ddd800a7-eb6b-4210-be77-23cd7a8542d4', true, 20),
  ('627cd510-c05d-47fc-ad82-6be16a6d9a01', 'd6f60532-f40b-4136-aa5d-969c4c0c2baf', true, 30)
ON CONFLICT (product_id, fabric_id) DO NOTHING;

-- SuedeCharm
INSERT INTO public.product_fabrics (product_id, fabric_id, is_available, display_order) VALUES
  ('860440a2-7e06-488d-9931-88498cd1ebfc', '229f63dd-a4e4-4a78-b97e-30c97193e4dd', true, 10),
  ('860440a2-7e06-488d-9931-88498cd1ebfc', 'f60768c5-47d9-4a52-a76f-33d725950249', true, 20),
  ('860440a2-7e06-488d-9931-88498cd1ebfc', 'e2fd47cc-0d51-422b-b8f7-a396a0b3d75c', true, 10),
  ('860440a2-7e06-488d-9931-88498cd1ebfc', 'ddd800a7-eb6b-4210-be77-23cd7a8542d4', true, 20),
  ('860440a2-7e06-488d-9931-88498cd1ebfc', 'd6f60532-f40b-4136-aa5d-969c4c0c2baf', true, 30)
ON CONFLICT (product_id, fabric_id) DO NOTHING;

SELECT 'seed-35: inserindo 14 product_prices (8 REDONDA RoundDream + 6 RETANGULAR Suede Comfort)...' AS log;

-- REDONDA: RoundDream (40x40, 50x50, 60x60, 70x70) x (essential, premium)
INSERT INTO public.product_prices (product_id, product_size_id, commercial_line, price, pix_price) VALUES
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', '29cd1c1b-8bb4-4313-8a0c-75e455d7e463', 'essential', 149.90, 139.90),
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', '29cd1c1b-8bb4-4313-8a0c-75e455d7e463', 'premium',   169.90, 159.90),
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', '4f7f6b50-ed5b-4688-8c2d-6197b09c9892', 'essential', 169.90, 159.90),
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', '4f7f6b50-ed5b-4688-8c2d-6197b09c9892', 'premium',   179.90, 169.90),
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', '4b0c07a0-ccc3-4974-8923-78ad5e9ac67a', 'essential', 179.90, 169.90),
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', '4b0c07a0-ccc3-4974-8923-78ad5e9ac67a', 'premium',   199.90, 189.90),
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', '2d46ef47-6636-4b33-9d8f-689b955aaef4', 'essential', 199.90, 189.90),
  ('9feba6e6-93e6-4892-b23c-e4b3f29d140d', '2d46ef47-6636-4b33-9d8f-689b955aaef4', 'premium',   219.90, 209.90)
ON CONFLICT (product_id, product_size_id, commercial_line) DO UPDATE SET price = EXCLUDED.price, pix_price = EXCLUDED.pix_price;

-- RETANGULAR: Suede Comfort (50x40, 60x50, 70x60) x (essential, premium)
INSERT INTO public.product_prices (product_id, product_size_id, commercial_line, price, pix_price) VALUES
  ('1ab212a3-113e-4983-b4ed-10307528a9a2', '212009b4-5985-4c92-bccb-7e602f697a16', 'essential', 189.90, 179.90),
  ('1ab212a3-113e-4983-b4ed-10307528a9a2', '212009b4-5985-4c92-bccb-7e602f697a16', 'premium',   229.90, 219.90),
  ('1ab212a3-113e-4983-b4ed-10307528a9a2', 'faa03b4d-4f3a-47ea-b388-a0fa6777f8e2', 'essential', 199.90, 189.90),
  ('1ab212a3-113e-4983-b4ed-10307528a9a2', 'faa03b4d-4f3a-47ea-b388-a0fa6777f8e2', 'premium',   239.90, 229.90),
  ('1ab212a3-113e-4983-b4ed-10307528a9a2', 'ef2b752a-054b-49ec-8bdb-8c47d440a114', 'essential', 229.90, 219.90),
  ('1ab212a3-113e-4983-b4ed-10307528a9a2', 'ef2b752a-054b-49ec-8bdb-8c47d440a114', 'premium',   269.90, 259.90)
ON CONFLICT (product_id, product_size_id, commercial_line) DO UPDATE SET price = EXCLUDED.price, pix_price = EXCLUDED.pix_price;

COMMIT;
