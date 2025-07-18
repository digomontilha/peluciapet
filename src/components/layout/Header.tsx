import { Heart, ShoppingBag, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import logo from '@/assets/pelucia-pet-logo.jpg';

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Não foi possível realizar o logout.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-soft backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <img 
            src={logo} 
            alt="PelúciaPet" 
            className="h-10 w-10 rounded-full object-cover shadow-soft"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-warm bg-clip-text text-transparent">
              PelúciaPet
            </h1>
            <p className="text-xs text-muted-foreground">
              Porque seu melhor amigo merece o melhor!
            </p>
          </div>
        </div>

        {/* Navegação Central */}
        <nav className="hidden md:flex items-center space-x-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Catálogo
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <Settings className="h-4 w-4 mr-2" />
              Painel Admin
            </Button>
          )}
        </nav>

        {/* Ações do usuário */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('https://wa.me/5511914608191', '_blank')}
            className="hover:bg-pet-gold hover:text-white transition-all duration-300"
          >
            <Heart className="h-4 w-4 mr-2" />
            Contato
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  {user.email?.split('@')[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur">
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Painel Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/auth')}
              className="border-pet-gold text-pet-gold hover:bg-pet-gold hover:text-white transition-all duration-300"
            >
              Login Admin
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}