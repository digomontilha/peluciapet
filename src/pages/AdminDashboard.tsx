import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Users, Settings, Plus, Eye, Mail, Bell } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  totalColors: number;
  pendingMessages: number;
}

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalCategories: 0,
    totalColors: 0,
    pendingMessages: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    if (isAdmin) {
      fetchStats();
      const cleanup = setupRealtimeSubscription();
      
      return cleanup;
    }
  }, [loading, isAdmin, navigate]);

  const fetchStats = async () => {
    try {
      const [productsResult, categoriesResult, colorsResult, messagesResult] = await Promise.all([
        supabase.from('products').select('id, status', { count: 'exact' }),
        supabase.from('categories').select('id', { count: 'exact' }),
        supabase.from('colors').select('id', { count: 'exact' }),
        supabase.from('contact_messages').select('id', { count: 'exact' }).eq('status', 'pending'),
      ]);

      const totalProducts = productsResult.count || 0;
      const activeProducts = productsResult.data?.filter(p => p.status === 'active').length || 0;
      const totalCategories = categoriesResult.count || 0;
      const totalColors = colorsResult.count || 0;
      const pendingMessages = messagesResult.count || 0;

      setStats({
        totalProducts,
        activeProducts,
        totalCategories,
        totalColors,
        pendingMessages,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as estatísticas.",
        variant: "destructive",
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('contact-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          // Recarregar estatísticas quando houver mudanças
          fetchStats();
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Nova mensagem de contato!",
              description: "Uma nova mensagem foi recebida.",
              variant: "default",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pet-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Gerencie produtos, categorias e configurações da PelúciaPet
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Produtos"
            value={stats.totalProducts}
            icon={Package}
            loading={loadingStats}
          />
          <StatCard
            title="Produtos Ativos"
            value={stats.activeProducts}
            icon={Eye}
            loading={loadingStats}
          />
          <StatCard
            title="Categorias"
            value={stats.totalCategories}
            icon={Settings}
            loading={loadingStats}
          />
          <StatCard
            title="Cores Disponíveis"
            value={stats.totalColors}
            icon={Package}
            loading={loadingStats}
          />
        </div>

        {/* Ações principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            title="Gerenciar Produtos"
            description="Adicionar, editar e organizar produtos"
            icon={Package}
            onClick={() => navigate('/admin/products')}
          />
          <ActionCard
            title="Categorias"
            description="Configurar categorias de produtos"
            icon={Settings}
            onClick={() => navigate('/admin/categories')}
          />
          <ActionCard
            title="Cores"
            description="Gerenciar paleta de cores"
            icon={Package}
            onClick={() => navigate('/admin/colors')}
          />
          <ActionCard
            title="Tamanhos"
            description="Configurar tamanhos e dimensões"
            icon={Settings}
            onClick={() => navigate('/admin/sizes')}
          />
          <ActionCard
            title="Administradores"
            description="Gerenciar usuários administrativos"
            icon={Users}
            onClick={() => navigate('/admin/users')}
          />
          <ActionCard
            title="Códigos de Variantes"
            description="Gerenciar códigos únicos por tamanho e cor"
            icon={Package}
            onClick={() => navigate('/admin/variants')}
          />
          <ActionCard
            title="Ver Catálogo"
            description="Visualizar loja como cliente"
            icon={Eye}
            onClick={() => navigate('/')}
          />
          <ActionCard
            title="Mensagens de Contato"
            description="Gerenciar mensagens do formulário"
            icon={Mail}
            onClick={() => navigate('/admin/contacts')}
            hasNotification={stats.pendingMessages > 0}
            notificationCount={stats.pendingMessages}
          />
          <ActionCard
            title="Novo Produto"
            description="Adicionar produto rapidamente"
            icon={Plus}
            onClick={() => navigate('/admin/products/new')}
            variant="primary"
          />
        </div>

        {/* Ações rápidas */}
        <Card className="mt-8 bg-white/80 backdrop-blur border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-primary">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => window.open('/', '_blank')}
                className="hover:bg-pet-gold hover:text-white transition-all duration-300"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview do Catálogo
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://wa.me/5511914608191', '_blank')}
                className="hover:bg-pet-gold hover:text-white transition-all duration-300"
              >
                WhatsApp da Loja
              </Button>
              <Button
                onClick={() => navigate('/admin/products/new')}
                className="bg-gradient-warm hover:bg-gradient-elegant transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  loading: boolean;
}

function StatCard({ title, value, icon: Icon, loading }: StatCardProps) {
  return (
    <Card className="bg-white/80 backdrop-blur border-0 shadow-soft">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-primary">
              {loading ? '...' : value}
            </p>
          </div>
          <Icon className="h-8 w-8 text-pet-gold" />
        </div>
      </CardContent>
    </Card>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'primary';
  hasNotification?: boolean;
  notificationCount?: number;
}

function ActionCard({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  variant = 'default',
  hasNotification = false,
  notificationCount = 0
}: ActionCardProps) {
  const isNotificationCard = hasNotification && notificationCount > 0;
  
  return (
    <Card 
      className={`cursor-pointer hover:shadow-warm transition-all duration-300 border-0 relative ${
        variant === 'primary' 
          ? 'bg-gradient-warm text-white hover:bg-gradient-elegant' 
          : isNotificationCard
          ? 'bg-orange-50 border-2 border-orange-200 hover:bg-orange-100'
          : 'bg-white/80 backdrop-blur hover:bg-white/90'
      }`}
      onClick={onClick}
    >
      {isNotificationCard && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge variant="destructive" className="h-6 min-w-6 flex items-center justify-center rounded-full animate-pulse">
            {notificationCount}
          </Badge>
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Icon className={`h-8 w-8 ${
              variant === 'primary' 
                ? 'text-white' 
                : isNotificationCard 
                ? 'text-orange-600' 
                : 'text-pet-gold'
            }`} />
            {isNotificationCard && (
              <Bell className="h-4 w-4 text-orange-600 absolute -top-1 -right-1 animate-pulse" />
            )}
          </div>
          <div>
            <h3 className={`font-semibold mb-2 ${
              variant === 'primary' 
                ? 'text-white' 
                : isNotificationCard 
                ? 'text-orange-800' 
                : 'text-primary'
            }`}>
              {title}
              {isNotificationCard && (
                <span className="ml-2 text-orange-600 font-bold">
                  ({notificationCount} nova{notificationCount > 1 ? 's' : ''})
                </span>
              )}
            </h3>
            <p className={`text-sm ${
              variant === 'primary' 
                ? 'text-white/90' 
                : isNotificationCard 
                ? 'text-orange-700' 
                : 'text-muted-foreground'
            }`}>
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}