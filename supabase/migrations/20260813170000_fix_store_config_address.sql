-- =====================================================================
-- Data fix: store_config.address_locality = 'Jundiai' (era 'Sao Paulo')
-- Conforme confirmado pelo Rodrigo em 2026-08-13.
-- Idempotente. Sem alteracao de schema.
-- =====================================================================

UPDATE public.store_config
SET address_locality = 'Jundiaí',
    address_region = 'SP',
    updated_at = now()
WHERE id = 1
  AND (address_locality IS DISTINCT FROM 'Jundiaí' OR address_region IS DISTINCT FROM 'SP');
