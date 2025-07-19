import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthContext';
import { Plus, Pencil, Trash2, ArrowLeft, User, Shield, Crown, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminProfile {
  id: string;
  user_id: string;
  full_name?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminProfile | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    full_name: '',
    role: 'user',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [searchingUser, setSearchingUser] = useState(false);

  // Verificar se o usuário tem permissão para acessar esta página
  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas super administradores podem gerenciar usuários.",
        variant: "destructive",
      });
      navigate('/admin');
      return;
    }
  }, [loading, isSuperAdmin, navigate, toast]);

  // Fetch admin users
  const { data: adminUsers, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Create/Update admin user mutation
  const saveUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingUser) {
        // Atualizar perfil do admin
        const { error } = await supabase
          .from('admin_profiles')
          .update({
            full_name: data.full_name,
            role: data.role
          })
          .eq('id', editingUser.id);
        if (error) throw error;

        // Atualizar senha se fornecida
        if (data.password) {
          // Para atualizar senha, seria necessário usar a API Admin
          // Por enquanto, vamos mostrar uma mensagem de que a senha não pode ser alterada
          toast({
            title: "Aviso",
            description: "Funcionalidade de alterar senha em desenvolvimento.",
            variant: "default",
          });
        }
      } else {
        // Criar perfil admin para usuário existente
        const { error } = await supabase
          .from('admin_profiles')
          .insert([{
            user_id: data.user_id,
            full_name: data.full_name,
            role: data.role
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({ user_id: '', full_name: '', role: 'user', email: '', password: '', confirmPassword: '' });
      toast({
        title: editingUser ? 'Usuário atualizado' : 'Usuário criado',
        description: editingUser ? 'O usuário admin foi atualizado com sucesso.' : 'O novo usuário admin foi criado com sucesso.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o usuário.',
        variant: 'destructive'
      });
      console.error('Error saving user:', error);
    }
  });

  // Delete admin user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Usuário removido',
        description: 'O usuário admin foi removido com sucesso.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao remover o usuário.',
        variant: 'destructive'
      });
      console.error('Error deleting user:', error);
    }
  });

  const handleSave = () => {
    if (!formData.full_name.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome completo é obrigatório.',
        variant: 'destructive'
      });
      return;
    }

    // Validações para novo usuário
    if (!editingUser) {
      if (!formData.user_id.trim()) {
        toast({
          title: 'Erro',
          description: 'O ID do usuário é obrigatório.',
          variant: 'destructive'
        });
        return;
      }
    }

    // Validar senha se estiver editando e foi fornecida
    if (editingUser && formData.password) {
      if (formData.password.length < 6) {
        toast({
          title: 'Erro',
          description: 'A senha deve ter pelo menos 6 caracteres.',
          variant: 'destructive'
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: 'Erro',
          description: 'As senhas não coincidem.',
          variant: 'destructive'
        });
        return;
      }
    }

    saveUserMutation.mutate(formData);
  };

  const searchUserByEmail = async (email: string) => {
    if (!email.trim()) return;
    
    setSearchingUser(true);
    try {
      // Como não podemos acessar auth.users diretamente, vamos verificar se já existe um perfil admin com este email
      // ou implementar uma solução mais simples
      toast({
        title: "Busca simplificada",
        description: "Por favor, digite manualmente o ID do usuário ou implemente busca personalizada.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
    } finally {
      setSearchingUser(false);
    }
  };

  const handleEdit = (user: AdminProfile) => {
    setEditingUser(user);
    setFormData({
      user_id: user.user_id,
      full_name: user.full_name || '',
      role: user.role,
      email: '',
      password: '',
      confirmPassword: ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este usuário admin?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({ user_id: '', full_name: '', role: 'user', email: '', password: '', confirmPassword: '' });
    setIsDialogOpen(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'user':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Gerenciar Usuários Admin</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          Gerencie os usuários com acesso administrativo
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário Admin' : 'Novo Usuário Admin'}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? 'Atualize as informações do usuário admin.'
                  : 'Adicione perfil administrativo a um usuário existente no Supabase Auth.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {editingUser && (
                <div>
                  <Label htmlFor="user_id">ID do Usuário *</Label>
                  <Input
                    id="user_id"
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    placeholder="UUID do usuário do Supabase Auth"
                    disabled={true}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O ID do usuário não pode ser alterado
                  </p>
                </div>
              )}
               
               {!editingUser && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search_email">Buscar por Email (opcional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="search_email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => searchUserByEmail(formData.email)}
                        disabled={searchingUser}
                      >
                        {searchingUser ? 'Buscando...' : 'Buscar'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Digite o email e clique em buscar para encontrar o ID automaticamente
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="user_id">ID do Usuário *</Label>
                    <Input
                      id="user_id"
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      placeholder="UUID do usuário do Supabase Auth"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Cole aqui o ID do usuário que já existe no Supabase Auth
                    </p>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome completo do usuário"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Função</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {editingUser && (
                <>
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4" />
                      <Label className="text-sm font-medium">Alterar Senha (opcional)</Label>
                    </div>
                    <div>
                      <Label htmlFor="password">Nova Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Digite a nova senha (mínimo 6 caracteres)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Confirme a nova senha"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deixe os campos em branco para manter a senha atual
                    </p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saveUserMutation.isPending}>
                {saveUserMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminUsers?.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{user.full_name || 'Sem nome'}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {user.user_id}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    disabled={deleteUserMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                {getRoleIcon(user.role)}
                {user.role === 'super_admin' ? 'Super Admin' : 'User'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {adminUsers?.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Nenhum usuário admin encontrado
          </p>
          <Button onClick={openCreateDialog} className="flex items-center gap-2 mx-auto">
            <Plus className="h-4 w-4" />
            Criar primeiro admin
          </Button>
        </div>
      )}
    </div>
  );
}