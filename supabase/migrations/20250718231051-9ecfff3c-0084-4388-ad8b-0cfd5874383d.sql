-- Criar tabela de tamanhos
CREATE TABLE public.sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  dimensions TEXT NOT NULL,
  width_cm INTEGER,
  height_cm INTEGER, 
  depth_cm INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;

-- Policies para tamanhos
CREATE POLICY "Anyone can view sizes" 
ON public.sizes 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage sizes" 
ON public.sizes 
FOR ALL 
USING (is_admin());

-- Inserir tamanhos padrão baseados na imagem
INSERT INTO public.sizes (name, dimensions, width_cm, height_cm, depth_cm, display_order) VALUES
('P', '50x40x17cm', 50, 40, 17, 1),
('M', '60x50x17cm', 60, 50, 17, 2),
('G', '70x60x17cm', 70, 60, 17, 3),
('GG', '80x70x17cm', 80, 70, 17, 4);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_sizes_updated_at
BEFORE UPDATE ON public.sizes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();