-- Corrigir políticas RLS para evitar recursão infinita

-- Primeiro, remover todas as políticas problemáticas
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage colors" ON public.colors;
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can manage product prices" ON public.product_prices;
DROP POLICY IF EXISTS "Users can view own admin profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admins can manage admin profiles" ON public.admin_profiles;

-- Criar função security definer para verificar se é admin (evita recursão)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles 
    WHERE admin_profiles.user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Criar função para verificar se é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles 
    WHERE admin_profiles.user_id = $1 AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Políticas simples para admin_profiles (sem recursão)
CREATE POLICY "Users can view own admin profile" ON public.admin_profiles 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all admin profiles" ON public.admin_profiles 
FOR ALL USING (auth.uid() IN (
  SELECT user_id FROM public.admin_profiles WHERE role = 'super_admin'
));

-- Políticas para outras tabelas usando as funções security definer
CREATE POLICY "Admins can manage categories" ON public.categories 
FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage products" ON public.products 
FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage colors" ON public.colors 
FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage product images" ON public.product_images 
FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage product prices" ON public.product_prices 
FOR ALL USING (public.is_admin());