-- Verificar e corrigir políticas do bucket product-images
-- Garantir que o bucket seja público e tenha políticas permissivas

-- Atualizar bucket para ser público se não for
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-images';

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Public access for images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Criar políticas permissivas para o bucket product-images
CREATE POLICY "Anyone can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images' AND is_admin());