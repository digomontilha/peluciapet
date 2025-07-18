-- Adicionar campo código aos produtos
ALTER TABLE public.products ADD COLUMN product_code TEXT;

-- Criar tabela para variantes de produtos com códigos únicos
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color_id UUID REFERENCES public.colors(id) ON DELETE SET NULL,
  variant_code TEXT NOT NULL UNIQUE,
  stock_quantity INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, size, color_id)
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for product_variants
CREATE POLICY "Admins can manage product variants" 
ON public.product_variants 
FOR ALL 
USING (is_admin());

CREATE POLICY "Anyone can view available product variants" 
ON public.product_variants 
FOR SELECT 
USING (is_available = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate variant code
CREATE OR REPLACE FUNCTION public.generate_variant_code(
  product_code TEXT,
  size_name TEXT,
  color_name TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  variant_code TEXT;
  size_prefix TEXT;
  color_prefix TEXT;
BEGIN
  -- Generate size prefix (first 2 letters)
  size_prefix := UPPER(LEFT(REGEXP_REPLACE(size_name, '[^A-Za-z0-9]', '', 'g'), 2));
  
  -- Generate color prefix if color exists
  IF color_name IS NOT NULL THEN
    color_prefix := UPPER(LEFT(REGEXP_REPLACE(color_name, '[^A-Za-z0-9]', '', 'g'), 2));
    variant_code := product_code || '-' || size_prefix || '-' || color_prefix;
  ELSE
    variant_code := product_code || '-' || size_prefix;
  END IF;
  
  RETURN variant_code;
END;
$$;