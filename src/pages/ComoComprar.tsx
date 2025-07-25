import { MessageCircle, ShoppingCart, CreditCard, Truck, Phone, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

export default function ComoComprar() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    assunto: '',
    mensagem: '',
    captcha: ''
  });

  // Estado do CAPTCHA
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: 0 });
  const [captchaInput, setCaptchaInput] = useState('');

  // Gerar novo CAPTCHA
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1, num2, answer: num1 + num2 });
    setCaptchaInput('');
  };

  // Gerar CAPTCHA inicial
  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleWhatsApp = () => {
    window.open('https://wa.me/5511914608191', '_blank');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar CAPTCHA
    if (parseInt(captchaInput) !== captcha.answer) {
      toast({
        title: "CAPTCHA incorreto!",
        description: "Por favor, resolva a operação matemática corretamente.",
        variant: "destructive"
      });
      generateCaptcha(); // Gerar novo CAPTCHA
      return;
    }

    try {
      // Enviar e-mail através da edge function
      const response = await fetch(`https://eogzmfpioypmrcbjnvtd.supabase.co/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
          assunto: formData.assunto,
          mensagem: formData.mensagem
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      toast({
        title: "Mensagem enviada com sucesso!",
        description: "Recebemos sua mensagem e entraremos em contato em breve.",
      });

      // Limpar formulário e gerar novo CAPTCHA
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        assunto: '',
        mensagem: '',
        captcha: ''
      });
      generateCaptcha();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Ocorreu um erro. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-warm text-white py-16">
        <div className="container text-center">
          <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Catálogo
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Como Comprar</h1>
          <p className="text-xl text-white/90">É muito fácil adquirir nossos produtos</p>
        </div>
      </section>

      <div className="container py-12">
        {/* Passo a Passo */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">Passo a Passo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 shadow-elegant hover:shadow-glow transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-pet-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-pet-gold" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">1. Entre em Contato</h3>
                <p className="text-muted-foreground">
                  Fale conosco pelo WhatsApp (11) 91460-8191 ou pelo formulário abaixo
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 shadow-elegant hover:shadow-glow transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-pet-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-pet-gold" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">2. Escolha seu Produto</h3>
                <p className="text-muted-foreground">
                  Navegue pelo nosso catálogo e escolha a caminha perfeita para seu pet
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 shadow-elegant hover:shadow-glow transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-pet-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-pet-gold" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">3. Formas de Pagamento</h3>
                <p className="text-muted-foreground">
                  PIX, transferência bancária ou parcelamento com juros via cartão
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 shadow-elegant hover:shadow-glow transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-pet-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-pet-gold" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">4. Entrega</h3>
                <p className="text-muted-foreground">
                  Frete à combinar conforme sua localização
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Formas de Pagamento e Entrega */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <Card className="shadow-elegant">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <CreditCard className="h-6 w-6 text-pet-gold mr-3" />
                <h3 className="text-2xl font-bold text-primary">Formas de Pagamento</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-semibold text-green-800">PIX</p>
                    <p className="text-sm text-green-600">(Desconto à vista)</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-semibold text-blue-800">Transferência Bancária</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <CheckCircle className="h-5 w-5 text-orange-600 mr-3" />
                  <div>
                    <p className="font-semibold text-orange-800">Cartão</p>
                    <p className="text-sm text-orange-600">(Parcelamento com juros)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <Truck className="h-6 w-6 text-pet-gold mr-3" />
                <h3 className="text-2xl font-bold text-primary">Entrega</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-pet-gold mb-2">Frete à Combinar</h4>
                  <p className="text-muted-foreground">
                    O valor do frete é calculado conforme sua localização. Entre em contato para consultar o valor.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-pet-gold mb-2">Prazo de Entrega</h4>
                  <p className="text-muted-foreground">
                    Após confirmação do pagamento: 7 a 15 dias úteis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Entre em Contato */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center text-primary mb-8">Entre em Contato</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Estamos aqui para esclarecer suas dúvidas e ajudar você a escolher a caminha perfeita para seu pet.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações de Contato */}
            <div className="space-y-6">
              <Card className="shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <MessageCircle className="h-6 w-6 text-pet-gold mr-3" />
                    <h3 className="text-xl font-bold text-primary">WhatsApp</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">(11) 91460-8191</p>
                  <Button onClick={handleWhatsApp} className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Conversar no WhatsApp
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Mail className="h-6 w-6 text-pet-gold mr-3" />
                    <h3 className="text-xl font-bold text-primary">E-mail</h3>
                  </div>
                  <a 
                    href="mailto:contato@peluciapet.com.br" 
                    className="text-muted-foreground hover:text-pet-gold transition-colors cursor-pointer"
                  >
                    contato@peluciapet.com.br
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Formulário de Contato */}
            <Card className="shadow-elegant">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-primary mb-6">Formulário de Contato</h3>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Nome *</label>
                      <Input 
                        name="nome"
                        value={formData.nome}
                        onChange={handleInputChange}
                        placeholder="Seu nome" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Telefone</label>
                      <Input 
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleInputChange}
                        placeholder="(11) 99999-9999" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">E-mail *</label>
                    <Input 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Assunto *</label>
                    <Input 
                      name="assunto"
                      value={formData.assunto}
                      onChange={handleInputChange}
                      placeholder="Sobre qual produto você quer saber?" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Mensagem *</label>
                    <Textarea 
                      name="mensagem"
                      value={formData.mensagem}
                      onChange={handleInputChange}
                      placeholder="Digite sua mensagem aqui..." 
                      rows={4} 
                      required 
                    />
                  </div>
                  
                  {/* CAPTCHA */}
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <label className="text-sm font-medium mb-2 block">
                      Verificação de Segurança *
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-mono bg-background px-3 py-1 rounded border">
                        {captcha.num1} + {captcha.num2} = ?
                      </span>
                    </div>
                    <Input
                      type="number"
                      placeholder="Digite o resultado"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="w-32"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Mensagem
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}