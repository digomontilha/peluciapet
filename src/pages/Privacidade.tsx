// src/pages/Privacidade.tsx
// Pagina placeholder. Conteudo juridico real sera adicionado na issue #40.
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useStoreConfig } from '@/hooks/use-store-config';

export default function Privacidade() {
  const { config: storeConfig } = useStoreConfig();
  return (
    <>
      <Helmet>
        <title>Politica de Privacidade | Pelucia Pet</title>
        <meta name="description" content="Como a Pelucia Pet coleta, usa e protege seus dados pessoais, em conformidade com a LGPD." />
        <link rel="canonical" href={`${storeConfig?.site_url || 'https://peluciapet.com.br'}/privacidade`} />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <Header />
      <main className="container py-16 max-w-3xl">
        <h1 className="text-3xl font-bold font-serif mb-4">Politica de Privacidade</h1>
        <p className="text-muted-foreground">
          Esta pagina esta sendo preparada. O texto juridico completo sera
          publicado em breve, em conformidade com a LGPD (Lei 13.709/2018).
        </p>
      </main>
      <Footer />
    </>
  );
}
