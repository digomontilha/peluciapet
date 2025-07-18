import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import logo from '@/assets/pelucia-pet-logo-oficial.png';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Verificar se é admin usando timeout para aguardar a sessão
          setTimeout(async () => {
            try {
              const { data: adminProfile, error } = await supabase
                .from('admin_profiles')
                .select('*')
                .eq('user_id', data.user.id)
                .maybeSingle();

              console.log('Admin check:', { adminProfile, error, userId: data.user.id });

              if (!adminProfile) {
                await supabase.auth.signOut();
                setError('Acesso negado. Apenas administradores podem fazer login.');
                setLoading(false);
                return;
              }

              toast({
                title: "Login realizado com sucesso!",
                description: `Bem-vindo(a), ${adminProfile.full_name || email}!`,
              });
              navigate('/admin');
              setLoading(false);
            } catch (err) {
              console.error('Erro ao verificar admin:', err);
              await supabase.auth.signOut();
              setError('Erro ao verificar permissões administrativas.');
              setLoading(false);
            }
          }, 100);
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: "Cadastro realizado!",
            description: "Verifique seu email para ativar a conta. Após a ativação, um administrador precisará aprovar seu acesso.",
          });
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos.';
      } else if (error.message.includes('User already registered')) {
        errorMessage = 'Este email já está cadastrado.';
      } else if (error.message.includes('Password should be at least 6 characters')) {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (error.message.includes('Acesso negado')) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src={logo} 
            alt="PelúciaPet" 
            className="h-20 w-20 mx-auto rounded-full object-cover shadow-warm mb-4"
          />
          <h1 className="text-3xl font-bold bg-gradient-warm bg-clip-text text-transparent">
            PelúciaPet
          </h1>
          <p className="text-muted-foreground mt-2">
            Acesso administrativo
          </p>
        </div>

        <Card className="shadow-warm border-0 bg-white/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-primary">
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? 'Entre com suas credenciais de administrador' 
                : 'Solicite acesso administrativo'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    className="border-pet-beige-medium focus:border-pet-gold"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@peluciapet.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-pet-beige-medium focus:border-pet-gold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-pet-beige-medium focus:border-pet-gold pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-warm hover:bg-gradient-elegant transition-all duration-300"
                disabled={loading}
              >
                {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-pet-gold hover:text-pet-brown-medium"
                >
                  {isLogin 
                    ? 'Não tem conta? Solicitar acesso' 
                    : 'Já tem conta? Entrar'
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-primary"
          >
            ← Voltar ao catálogo
          </Button>
        </div>
      </div>
    </div>
  );
}