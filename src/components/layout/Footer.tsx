import { Instagram, MessageCircle, Mail, Phone, MapPin, FileText, HelpCircle, Shield, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStoreConfig } from '@/hooks/use-store-config';

export function Footer() {
  const { config: storeConfig } = useStoreConfig();

  const whatsappNumber = storeConfig?.whatsapp_number || '5511937413939';
  const whatsappDisplay = storeConfig?.whatsapp_display || '(11) 93741-3939';
  const email = storeConfig?.email || 'contato@peluciapet.com.br';
  const addressLocality = storeConfig?.address_locality || 'Jundiaí';
  const addressRegion = storeConfig?.address_region || 'SP';
  const addressDisplay = addressRegion ? `${addressLocality} - ${addressRegion}` : addressLocality;
  const instagramUrl = storeConfig?.instagram_url || 'https://www.instagram.com/pelucia.pet';
  const currentYear = new Date().getFullYear();
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <footer className="bg-gradient-elegant text-white mt-0">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Marca */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <h3 className="text-xl font-serif font-bold text-pet-gold">Pelúcia Pet</h3>
            <p className="text-sm text-white/90">
              Caminhas premium pra pets que merecem o melhor.
            </p>
          </div>

          {/* Links úteis */}
          <div className="space-y-4">
            <h4 className="font-semibold text-pet-gold">Comprar</h4>
            <div className="space-y-2">
              <Link
                to="/como-comprar"
                className="flex items-center gap-2 text-sm text-white/90 hover:text-pet-gold transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Como Comprar
              </Link>
              <Link
                to="/faq"
                className="flex items-center gap-2 text-sm text-white/90 hover:text-pet-gold transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                FAQ
              </Link>
              <Link
                to="/trocas-e-devolucoes"
                className="flex items-center gap-2 text-sm text-white/90 hover:text-pet-gold transition-colors"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Trocas e Devoluções
              </Link>
              <Link
                to="/privacidade"
                className="flex items-center gap-2 text-sm text-white/90 hover:text-pet-gold transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                Política de Privacidade
              </Link>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4 min-w-0">
            <h4 className="font-semibold text-pet-gold">Contato</h4>
            <div className="space-y-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${whatsappDisplay}`}
                className="flex items-center space-x-2 text-sm text-white/90 hover:text-pet-gold transition-colors min-w-0"
              >
                <Phone className="h-4 w-4 text-pet-gold shrink-0" />
                <span>{whatsappDisplay}</span>
              </a>
              <a
                href={`mailto:${email}`}
                aria-label={`Enviar email para ${email}`}
                className="flex items-center space-x-2 text-xs sm:text-sm text-white/90 hover:text-pet-gold transition-colors min-w-0 w-full text-left group"
              >
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pet-gold shrink-0" />
                <span className="min-w-0 leading-tight">{email}</span>
              </a>
              <div className="flex items-center space-x-2 text-sm text-white/70">
                <MapPin className="h-4 w-4 text-pet-gold/70 shrink-0" />
                <span>{addressDisplay}</span>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="font-semibold text-pet-gold">Siga a gente</h4>
            <div className="flex gap-3">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-pet-gold/20 hover:scale-110 flex items-center justify-center transition-all duration-200"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${whatsappDisplay}`}
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
            © {currentYear} Pelúcia Pet. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
