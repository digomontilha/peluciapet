// src/pages/TrocasDevolucoes.tsx
// Pagina placeholder. Conteudo juridico real sera adicionado na issue #40.
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useStoreConfig } from '@/hooks/use-store-config';

export default function TrocasDevolucoes() {
  const { config: storeConfig } = useStoreConfig();
  return (
    <>
      <Helmet>
        <title>Trocas e Devolucoes | Pelucia Pet</title>
        <meta name="description" content="Politica de trocas e devolucoes da Pelucia Pet, conforme o Codigo de Defesa do Consumidor." />
        <link rel="canonical" href={`${storeConfig?.site_url || 'https://peluciapet.com.br'}/trocas-e-devolucoes`} />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <Header />
      <main className="container py-16 max-w-3xl">
        <h1 className="text-3xl font-bold font-serif mb-4">Trocas e Devolucoes</h1>
        <p className="text-muted-foreground">
          Esta pagina esta sendo preparada. O texto juridico completo sera
          publicado em breve, em conformidade com o CDC (Lei 8.078/1990).
        </p>
      </main>
      <Footer />
    </>
  );
}
