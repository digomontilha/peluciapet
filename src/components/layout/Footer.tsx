import { Instagram, MessageCircle, Mail, Phone, MapPin, Shield, FileText, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="bg-gradient-elegant text-white mt-0">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Marca */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <h3 className="text-xl font-serif font-bold text-pet-gold">PelúciaPet</h3>
            <p className="text-sm text-white/90">
              Caminhas premium pra pets que merecem o melhor.
            </p>
            <p className="text-xs text-white/70">
              Antialérgicas, laváveis e feitas pra durar.
            </p>
          </div>

          {/* Links úteis */}
          <div className="space-y-4">
            <h4 className="font-semibold text-pet-gold">Comprar</h4>
            <div className="space-y-2">
              <a
                href="/como-comprar"
                className="flex items-center gap-2 text-sm text-white/90 hover:text-pet-gold transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Como Comprar
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-sm text-white/90 hover:text-pet-gold transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                FAQ
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-sm text-white/90 hover:text-pet-gold transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                Política de Privacidade
              </a>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4 min-w-0">
            <h4 className="font-semibold text-pet-gold">Contato</h4>
            <div className="space-y-3">
              <button
                onClick={() => window.open('https://wa.me/5511937413939', '_blank')}
                className="flex items-center space-x-2 text-sm text-white/90 hover:text-pet-gold transition-colors cursor-pointer min-w-0"
              >
                <Phone className="h-4 w-4 text-pet-gold shrink-0" />
                <span>(11) 93741-3939</span>
              </button>
              <button
                onClick={() => window.open('mailto:contato@peluciapet.com.br', '_blank')}
                className="flex items-center space-x-2 text-xs sm:text-sm text-white/90 hover:text-pet-gold transition-colors cursor-pointer min-w-0 w-full text-left group"
              >
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pet-gold shrink-0" />
                <span className="min-w-0 leading-tight">contato@peluciapet.com.br</span>
              </button>
              <div className="flex items-center space-x-2 text-sm text-white/70">
                <MapPin className="h-4 w-4 text-pet-gold/70 shrink-0" />
                <span>São Paulo - SP</span>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="font-semibold text-pet-gold">Siga a gente</h4>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/pelucia.pet"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-pet-gold/20 hover:scale-110 flex items-center justify-center transition-all duration-200"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/5511937413939"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-pet-gold/20 hover:scale-110 flex items-center justify-center transition-all duration-200"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
            <p className="text-xs text-white/60 leading-snug">
              Atendimento via WhatsApp em horário comercial.
            </p>
          </div>
        </div>

        <div className="border-t border-white/20 mt-10 pt-6 text-center">
          <p className="text-sm text-white/70">
            © 2025 PelúciaPet. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}