-- Corrigir função para gerar código de produto automático
CREATE OR REPLACE FUNCTION public.generate_auto_product_code(
  p_category_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  category_prefix TEXT;
  next_number INTEGER;
  product_code TEXT;
BEGIN
  -- Buscar os 3 primeiros caracteres da categoria
  SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 3))
  INTO category_prefix
  FROM categories
  WHERE id = p_category_id;
  
  -- Se não encontrar categoria, usar 'PRD'
  IF category_prefix IS NULL OR LENGTH(category_prefix) = 0 THEN
    category_prefix := 'PRD';
  END IF;
  
  -- Completar com zeros se necessário para ter 3 caracteres
  category_prefix := RPAD(category_prefix, 3, '0');
  
  -- Buscar o próximo número sequencial para esta categoria
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(p.product_code FROM LENGTH(category_prefix) + 1) AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM products p
  JOIN categories c ON p.category_id = c.id
  WHERE UPPER(LEFT(REGEXP_REPLACE(c.name, '[^A-Za-z0-9]', '', 'g'), 3)) = LEFT(category_prefix, 3)
  AND p.product_code ~ ('^' || category_prefix || '[0-9]+$');
  
  -- Se não encontrou nenhum, começar com 1
  IF next_number IS NULL THEN
    next_number := 1;
  END IF;
  
  -- Gerar o código final: 3chars_categoria + numero_sequencial_3_digitos
  product_code := category_prefix || LPAD(next_number::TEXT, 3, '0');
  
  RETURN product_code;
END;
$$;