-- Atualizar constraint da tabela admin_profiles para permitir role 'user'

-- Remover constraint antigo
ALTER TABLE public.admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_role_check;

-- Criar novo constraint que permite 'user', 'admin', e 'super_admin'
ALTER TABLE public.admin_profiles ADD CONSTRAINT admin_profiles_role_check 
CHECK (role IN ('user', 'admin', 'super_admin'));