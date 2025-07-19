-- Atualizar RLS policies para restringir gestão de usuários apenas para super_admin

-- Remover a política antiga de inserção
DROP POLICY IF EXISTS "Super admins can insert admin profiles" ON public.admin_profiles;

-- Criar nova política para inserção (apenas super_admin)
CREATE POLICY "Super admins can insert admin profiles" 
ON public.admin_profiles 
FOR INSERT 
WITH CHECK (is_super_admin());

-- Atualizar a política de gerenciamento para separar entre visualização e modificação
DROP POLICY IF EXISTS "Super admins can manage all admin profiles" ON public.admin_profiles;

-- Política para visualização (super_admin pode ver todos, users só podem ver próprio perfil)
CREATE POLICY "Super admins can view all profiles, users view own" 
ON public.admin_profiles 
FOR SELECT 
USING (
  is_super_admin() OR 
  (user_id = auth.uid())
);

-- Política para atualização (apenas super_admin pode atualizar)
CREATE POLICY "Super admins can update admin profiles" 
ON public.admin_profiles 
FOR UPDATE 
USING (is_super_admin());

-- Política para exclusão (apenas super_admin pode excluir)
CREATE POLICY "Super admins can delete admin profiles" 
ON public.admin_profiles 
FOR DELETE 
USING (is_super_admin());