import { Heart, ShoppingBag, User, LogOut, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
import { useState } from 'react';
import logo from '/lovable-uploads/96f8f9d3-cd58-4b22-a2ab-9f8c894aa0f3.png';

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-soft/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo - Versão responsiva */}
        <div className="flex items-center space-x-3">
          <img 
            src={logo} 
            alt="PelúciaPet" 
            className="h-10 w-10 rounded-full object-cover shadow-soft"
          />
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-bold bg-gradient-warm bg-clip-text text-transparent">
              PelúciaPet
            </h1>
            <p className="hidden sm:block text-xs text-muted-foreground">
              Porque seu melhor amigo merece o melhor!
            </p>
          </div>
        </div>

        {/* Navegação Desktop */}
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

        {/* Ações Desktop */}
        <div className="hidden md:flex items-center space-x-2">
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

        {/* Menu Mobile */}
        <div className="md:hidden flex items-center space-x-1">
          {/* Botão Contato Mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('https://wa.me/5511914608191', '_blank')}
            className="p-2 hover:bg-pet-gold hover:text-white transition-all duration-300"
          >
            <Heart className="h-4 w-4" />
          </Button>

          {/* Menu Hambúrguer */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <img 
                    src={logo} 
                    alt="PelúciaPet" 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="text-xl font-bold bg-gradient-warm bg-clip-text text-transparent">
                    PelúciaPet
                  </span>
                </SheetTitle>
                <SheetDescription>
                  Navegue pelo nosso catálogo e encontre o melhor para seu pet
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-8 space-y-4">
                {/* Navegação */}
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation('/')}
                    className="w-full justify-start h-12 text-left"
                  >
                    <ShoppingBag className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-medium">Catálogo</div>
                      <div className="text-xs text-muted-foreground">Ver todos os produtos</div>
                    </div>
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      onClick={() => handleNavigation('/admin')}
                      className="w-full justify-start h-12 text-left"
                    >
                      <Settings className="h-5 w-5 mr-3" />
                      <div>
                        <div className="font-medium">Painel Admin</div>
                        <div className="text-xs text-muted-foreground">Gerenciar produtos</div>
                      </div>
                    </Button>
                  )}
                </div>

                {/* Contato */}
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open('https://wa.me/5511914608191', '_blank');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start h-12 border-pet-gold text-pet-gold hover:bg-pet-gold hover:text-white"
                  >
                    <Heart className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-medium">Contato via WhatsApp</div>
                      <div className="text-xs opacity-75">(11) 91460-8191</div>
                    </div>
                  </Button>
                </div>

                {/* Autenticação */}
                <div className="border-t pt-4">
                  {user ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-pet-gold/10 rounded-lg">
                        <User className="h-5 w-5 text-pet-gold" />
                        <div>
                          <div className="font-medium">{user.email?.split('@')[0]}</div>
                          <div className="text-xs text-muted-foreground">Logado como admin</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleSignOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="default"
                      onClick={() => handleNavigation('/auth')}
                      className="w-full bg-pet-gold hover:bg-pet-gold/90"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Login Admin
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}