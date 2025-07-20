-- Criar função para gerar código de variante automático
CREATE OR REPLACE FUNCTION public.generate_auto_variant_code(
  p_product_id UUID,
  p_color_id UUID DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  category_prefix TEXT;
  color_prefix TEXT;
  next_number INTEGER;
  variant_code TEXT;
  quantity_number INTEGER;
BEGIN
  -- Buscar os 3 primeiros caracteres da categoria do produto
  SELECT UPPER(LEFT(REGEXP_REPLACE(c.name, '[^A-Za-z0-9]', '', 'g'), 3))
  INTO category_prefix
  FROM products p
  JOIN categories c ON p.category_id = c.id
  WHERE p.id = p_product_id;
  
  -- Se não encontrar categoria, usar 'GEN'
  IF category_prefix IS NULL OR LENGTH(category_prefix) = 0 THEN
    category_prefix := 'GEN';
  END IF;
  
  -- Completar com zeros se necessário
  category_prefix := RPAD(category_prefix, 3, '0');
  
  -- Buscar os 3 primeiros caracteres da cor (se fornecida)
  IF p_color_id IS NOT NULL THEN
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 3))
    INTO color_prefix
    FROM colors
    WHERE id = p_color_id;
    
    -- Se não encontrar cor, usar 'COR'
    IF color_prefix IS NULL OR LENGTH(color_prefix) = 0 THEN
      color_prefix := 'COR';
    END IF;
  ELSE
    color_prefix := 'SEM';
  END IF;
  
  -- Completar com zeros se necessário
  color_prefix := RPAD(color_prefix, 3, '0');
  
  -- Buscar o próximo número sequencial para esta combinação categoria+cor
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(
        variant_code 
        FROM POSITION(category_prefix IN variant_code) + 3 
        FOR POSITION(color_prefix IN variant_code) - POSITION(category_prefix IN variant_code) - 3
      ) AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM product_variants pv
  JOIN products p ON pv.product_id = p.id
  JOIN categories c ON p.category_id = c.id
  WHERE UPPER(LEFT(REGEXP_REPLACE(c.name, '[^A-Za-z0-9]', '', 'g'), 3)) = LEFT(category_prefix, 3)
  AND (
    (p_color_id IS NOT NULL AND pv.color_id = p_color_id) OR
    (p_color_id IS NULL AND pv.color_id IS NULL)
  )
  AND variant_code LIKE category_prefix || '%' || color_prefix || '%';
  
  -- Se não encontrou nenhum, começar com 1
  IF next_number IS NULL THEN
    next_number := 1;
  END IF;
  
  -- Buscar o próximo número de quantidade para este produto específico
  SELECT COALESCE(COUNT(*), 0) + 1
  INTO quantity_number
  FROM product_variants
  WHERE product_id = p_product_id;
  
  -- Gerar o código final: 3chars_categoria + numero_auto + 3chars_cor + numero_quantidade
  variant_code := category_prefix || LPAD(next_number::TEXT, 3, '0') || color_prefix || LPAD(quantity_number::TEXT, 2, '0');
  
  RETURN variant_code;
END;
$$;