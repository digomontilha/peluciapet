import { Instagram, MessageCircle, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="bg-gradient-elegant text-white mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Informações da empresa */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-pet-gold">PelúciaPet</h3>
            <p className="text-sm text-white/90">
              Porque seu melhor amigo merece o melhor!
            </p>
            <p className="text-sm text-white/80">
              Produtos de alta qualidade para o conforto e bem-estar do seu pet.
            </p>
          </div>

          {/* Links úteis */}
          <div className="space-y-4">
            <h4 className="font-semibold text-pet-gold">Links Úteis</h4>
            <div className="space-y-2">
              <a 
                href="/como-comprar" 
                className="block text-sm text-white/90 hover:text-pet-gold transition-colors"
              >
                Como Comprar
              </a>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h4 className="font-semibold text-pet-gold">Contato</h4>
            <div className="space-y-2">
              <button 
                onClick={() => window.open('https://wa.me/5511914608191', '_blank')}
                className="flex items-center space-x-2 text-sm hover:text-pet-gold transition-colors cursor-pointer"
              >
                <Phone className="h-4 w-4 text-pet-gold" />
                <span>(11) 91460-8191</span>
              </button>
              <button 
                onClick={() => window.open('mailto:contato@peluciapet.com.br', '_blank')}
                className="flex items-center space-x-2 text-sm hover:text-pet-gold transition-colors cursor-pointer"
              >
                <Mail className="h-4 w-4 text-pet-gold" />
                <span>contato@peluciapet.com.br</span>
              </button>
            </div>
          </div>

        </div>

        <div className="border-t border-white/20 mt-8 pt-6 text-center">
          <p className="text-sm text-white/70">
            © 2025 PelúciaPet. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}