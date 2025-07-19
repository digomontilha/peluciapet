-- Criar tabela de tamanhos específicos por produto
CREATE TABLE public.product_sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  name TEXT NOT NULL,
  dimensions TEXT NOT NULL,
  width_cm INTEGER,
  height_cm INTEGER, 
  depth_cm INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, name)
);

-- Enable RLS
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

-- Policies para tamanhos de produtos
CREATE POLICY "Anyone can view product sizes" 
ON public.product_sizes 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage product sizes" 
ON public.product_sizes 
FOR ALL 
USING (is_admin());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_product_sizes_updated_at
BEFORE UPDATE ON public.product_sizes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrar dados existentes da tabela sizes para todos os produtos
INSERT INTO public.product_sizes (product_id, name, dimensions, width_cm, height_cm, depth_cm, display_order)
SELECT 
  p.id as product_id,
  s.name,
  s.dimensions,
  s.width_cm,
  s.height_cm,
  s.depth_cm,
  s.display_order
FROM public.products p
CROSS JOIN public.sizes s;

-- Atualizar tabela product_prices para referenciar product_sizes ao invés de sizes
ALTER TABLE public.product_prices 
ADD COLUMN product_size_id UUID REFERENCES public.product_sizes(id);

-- Migrar dados de product_prices para usar a nova referência
UPDATE public.product_prices 
SET product_size_id = ps.id
FROM public.product_sizes ps
WHERE product_prices.product_id = ps.product_id 
AND product_prices.size = ps.name;

-- Remover a coluna size antiga após migração
ALTER TABLE public.product_prices DROP COLUMN size;

-- Atualizar tabela product_variants para referenciar product_sizes
ALTER TABLE public.product_variants 
ADD COLUMN product_size_id UUID REFERENCES public.product_sizes(id);

-- Migrar dados de product_variants para usar a nova referência
UPDATE public.product_variants 
SET product_size_id = ps.id
FROM public.product_sizes ps
WHERE product_variants.product_id = ps.product_id 
AND product_variants.size = ps.name;

-- Remover a coluna size antiga após migração
ALTER TABLE public.product_variants DROP COLUMN size;