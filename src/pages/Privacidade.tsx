// src/pages/Privacidade.tsx
// Conteudo LGPD template (issue #45). Aviso de modelo juridico no topo.
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
        <meta name="description" content="Como a Pelucia Pet coleta, usa e protege seus dados pessoais, em conformidade com a LGPD (Lei 13.709/2018)." />
        <link rel="canonical" href={`${storeConfig?.site_url || 'https://peluciapet.com.br'}/privacidade`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Politica de Privacidade | Pelucia Pet" />
        <meta property="og:description" content="Como a Pelucia Pet coleta, usa e protege seus dados pessoais, em conformidade com a LGPD." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${storeConfig?.site_url || 'https://peluciapet.com.br'}/privacidade`} />
      </Helmet>
      <Header />
      <main className="container py-16 max-w-3xl">
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 mb-8 text-sm text-amber-900">
          <strong>Texto modelo</strong> — este conteudo foi gerado a partir de templates
          publicos de Politica de Privacidade e nao substitui revisao juridica.{' '}
          <strong>Consulte um advogado antes de publicar oficialmente.</strong> Os campos
          marcados com <code className="bg-amber-100 px-1 rounded">TODO</code> precisam
          ser preenchidos com os dados reais da sua empresa (CNPJ, endereco do encarregado
          pelo tratamento de dados, etc).
        </div>

        <h1 className="text-3xl font-bold font-serif mb-2">Politica de Privacidade</h1>
        <p className="text-muted-foreground mb-8">
          Ultima atualizacao: agosto de 2026. Esta politica descreve como a Pelucia Pet
          coleta, usa, armazena e protege os dados pessoais dos seus clientes, em
          conformidade com a Lei Geral de Protecao de Dados (LGPD — Lei 13.709/2018).
        </p>

        <section className="space-y-8">
          <article>
            <h2 className="text-xl font-semibold mb-3">1. Dados que coletamos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para processar pedidos e entregar as caminhas, coletamos: nome completo,
              telefone (com DDD), e-mail e endereco de entrega (CEP, logradouro, numero,
              complemento, bairro, cidade e estado). Os dados sao fornecidos diretamente
              por voce no momento da compra, via WhatsApp.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">2. Finalidade de uso</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os dados pessoais sao utilizados para: processar e confirmar pedidos;
              emitir comunicacoes sobre o pedido (confirmacao, despacho, entrega);
              responder a duvidas e solicitacoes; cumprir obrigacoes legais e fiscais.
              Nao utilizamos seus dados para envio de newsletters, promocoes ou qualquer
              outro tipo de comunicacao de marketing sem consentimento explicito.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">3. Compartilhamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para que a entrega aconteca, compartilhamos nome, telefone e endereco
              com a transportadora responsavel pelo envio. Para que os e-mails de
              confirmacao sejam enviados, utilizamos o servico Resend, que recebe
              apenas o seu endereco de e-mail e o conteudo da mensagem. Nosso banco
              de dados e hospedado no Supabase, que mantem a infraestrutura em
              servidores com controles de seguranca. Nao vendemos, alugamos ou
              compartilhamos seus dados com terceiros para fins de marketing.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">4. Direitos do titular</h2>
            <p className="text-muted-foreground leading-relaxed">
              A LGPD garante a voce os direitos previstos no artigo 18, entre eles:
              acesso aos dados que temos sobre voce; correcao de dados incompletos
              ou desatualizados; anonimizacao, bloqueio ou eliminacao de dados
              desnecessarios; revogacao do consentimento. Para exercer qualquer um
              desses direitos, entre em contato pelo e-mail{' '}
              <a className="text-primary underline" href={`mailto:${storeConfig?.email || 'contato@peluciapet.com.br'}`}>
                {storeConfig?.email || 'contato@peluciapet.com.br'}
              </a>
              {' '}ou pelo WhatsApp cadastrado no site. Responderemos em ate 15 dias.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">5. Encarregado pelo tratamento de dados (DPO)</h2>
            <p className="text-muted-foreground leading-relaxed">
              O encarregado pelo tratamento de dados pessoais da Pelucia Pet e
              o responsavel por receber duvidas, reclamacoes e pedidos de
              titulares.{' '}
              <strong className="text-amber-800">TODO:</strong> preencher com nome
              completo, e-mail dedicado e telefone do encarregado (DPD/DPO)
              designado. Enquanto nao houver DPO formal, o contato inicial pode
              ser feito pelo e-mail{' '}
              <a className="text-primary underline" href={`mailto:${storeConfig?.email || 'contato@peluciapet.com.br'}`}>
                {storeConfig?.email || 'contato@peluciapet.com.br'}
              </a>.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong className="text-amber-800">TODO:</strong> informar{' '}
              <code className="bg-amber-100 px-1 rounded">CNPJ</code>, razao social e
              endereco comercial completo da Pelucia Pet.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">6. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Este site utiliza apenas cookies estritamente necessarios para o
              funcionamento da area administrativa (sessao de login do painel).
              Nao utilizamos cookies de rastreamento, analise comportamental ou
              publicidade. Caso cookies de terceiros sejam adicionados no futuro,
              esta politica sera atualizada e o respectivo aviso sera exibido.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">7. Seguranca</h2>
            <p className="text-muted-foreground leading-relaxed">
              O site e acessado exclusivamente via HTTPS. Os dados sao armazenados
              no Supabase, com politicas de seguranca de linha (RLS) que limitam
              o acesso por usuario. Apenas pessoas autorizadas da Pelucia Pet
              tem acesso aos dados de pedidos, e unicamente para cumprir as
              finalidades descritas nesta politica. Mesmo assim, nenhum sistema
              e 100% imune a incidentes; em caso de violacao que possa causar
              risco aos titulares, comunicaremos conforme previsto no artigo 48
              da LGPD.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">8. Base legal</h2>
            <p className="text-muted-foreground leading-relaxed">
              O tratamento dos dados pessoais describedo nesta politica se
              fundamenta, principalmente, na execucao de contrato (art. 7, V da
              LGPD) — para que seu pedido seja processado e entregue — e, quando
              aplicavel, no consentimento (art. 7, I) e no cumprimento de
              obrigacoes legais (art. 7, II).
            </p>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}
