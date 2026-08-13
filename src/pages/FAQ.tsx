// src/pages/FAQ.tsx
// Pagina placeholder. Conteudo real sera adicionado na issue #40.
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useStoreConfig } from '@/hooks/use-store-config';

export default function FAQ() {
  const { config: storeConfig } = useStoreConfig();
  return (
    <>
      <Helmet>
        <title>FAQ | Pelucia Pet</title>
        <meta name="description" content="Perguntas frequentes sobre caminhas, tecidos, prazos e pagamento da Pelucia Pet." />
        <link rel="canonical" href={`${storeConfig?.site_url || 'https://peluciapet.com.br'}/faq`} />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <Header />
      <main className="container py-16 max-w-3xl">
        <h1 className="text-3xl font-bold font-serif mb-4">Perguntas Frequentes</h1>
        <p className="text-muted-foreground">
          Esta pagina esta sendo preparada. Em breve voce encontrara aqui respostas
          sobre tamanhos, tecidos, prazos, pagamento e garantia.
        </p>
      </main>
      <Footer />
    </>
  );
}
