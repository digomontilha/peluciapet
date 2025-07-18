-- Remove policies problemáticas
DROP POLICY IF EXISTS "Super admins can manage all admin profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Users can view own admin profile" ON admin_profiles;

-- Cria política simples para usuários verem apenas seus próprios perfis
CREATE POLICY "Users can view own admin profile" 
ON admin_profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Permite super admins gerenciarem todos os perfis usando a função existente
CREATE POLICY "Super admins can manage all admin profiles" 
ON admin_profiles 
FOR ALL 
USING (is_super_admin());

-- Permite inserção para super admins
CREATE POLICY "Super admins can insert admin profiles" 
ON admin_profiles 
FOR INSERT 
WITH CHECK (is_super_admin());