// src/pages/TrocasDevolucoes.tsx
// Conteudo CDC + LGPD template (issue #45). Aviso de modelo juridico no topo.
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
        <meta name="description" content="Politica de trocas e devolucoes da Pelucia Pet, conforme o Codigo de Defesa do Consumidor (Lei 8.078/1990)." />
        <link rel="canonical" href={`${storeConfig?.site_url || 'https://peluciapet.com.br'}/trocas-e-devolucoes`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Trocas e Devolucoes | Pelucia Pet" />
        <meta property="og:description" content="Politica de trocas e devolucoes da Pelucia Pet, conforme o CDC." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${storeConfig?.site_url || 'https://peluciapet.com.br'}/trocas-e-devolucoes`} />
      </Helmet>
      <Header />
      <main className="container py-16 max-w-3xl">
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 mb-8 text-sm text-amber-900">
          <strong>Texto modelo</strong> — este conteudo foi gerado a partir do Codigo
          de Defesa do Consumidor e nao substitui revisao juridica.{' '}
          <strong>Consulte um advogado antes de publicar oficialmente.</strong> Os
          campos marcados com <code className="bg-amber-100 px-1 rounded">TODO</code>{' '}
          precisam ser preenchidos com os dados reais da sua empresa.
        </div>

        <h1 className="text-3xl font-bold font-serif mb-2">Trocas e Devolucoes</h1>
        <p className="text-muted-foreground mb-8">
          Esta politica explica como funcionam as trocas, devolucoes e o direito de
          arrependimento nas compras realizadas na Pelucia Pet, em conformidade com
          o Codigo de Defesa do Consumidor (Lei 8.078/1990) e com a LGPD (Lei
          13.709/2018) para os dados envolvidos.
        </p>

        <section className="space-y-8">
          <article>
            <h2 className="text-xl font-semibold mb-3">1. Direito de arrependimento (compra online)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para compras realizadas fora do estabelecimento comercial (pela internet
              ou por WhatsApp), o CDC (art. 49) da ao consumidor o direito de se
              arrepender da compra em ate <strong>7 dias corridos</strong> a partir do
              recebimento do produto, sem necessidade de justificativa e com reembolso
              integral do valor pago, incluindo o frete.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Para exercer esse direito, entre em contato pelo WhatsApp ou pelo e-mail{' '}
              <a className="text-primary underline" href={`mailto:${storeConfig?.email || 'contato@peluciapet.com.br'}`}>
                {storeConfig?.email || 'contato@peluciapet.com.br'}
              </a>{' '}em ate 7 dias corridos apos o recebimento. O produto deve ser
              devolvido em perfeitas condicoes, sem uso, com a etiqueta e a embalagem
              originais.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">2. Vicios no produto (defeitos)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Em caso de vicio de fabricacao (costuras abrindo, ziper com defeito,
              enchimento avariado, etc.), o CDC (art. 26) estabelece os seguintes
              prazos para reclamacao:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Produtos nao duraveis: ate <strong>30 dias</strong> a partir do recebimento.</li>
              <li>Produtos duraveis: ate <strong>90 dias</strong> a partir do recebimento.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Para solicitacoes dentro do prazo, entre em contato pelo WhatsApp com
              fotos do defeito, numero do pedido e descricao do problema. Em caso
              de vicio confirmado, o custo de envio de devolucao e por nossa conta.
              O consumidor pode optar por trocar o produto, receber reembolso
              integral ou um credito.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">3. Como solicitar troca ou devolucao</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para qualquer solicitacao, entre em contato pelo nosso canal oficial:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>WhatsApp: {storeConfig?.whatsapp_display || '(11) 93741-3939'}</li>
              <li>
                E-mail:{' '}
                <a className="text-primary underline" href={`mailto:${storeConfig?.email || 'contato@peluciapet.com.br'}`}>
                  {storeConfig?.email || 'contato@peluciapet.com.br'}
                </a>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Informe: numero do pedido, motivo da solicitacao, fotos (em caso de
              vicio) e a opcao desejada (troca, devolucao com reembolso ou credito).
              Responderemos em ate 5 dias uteis com as orientacoes de envio.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">4. Condicoes do produto para troca ou devolucao</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para que a troca ou devolucao seja aceita, o produto precisa atender
              aos seguintes requisitos:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Sem sinais de uso (sem pelos, manchas, odores ou marcas).</li>
              <li>Com a etiqueta original afixada.</li>
              <li>Na embalagem original ou em embalagem que proteja o produto durante o transporte.</li>
              <li>Acompanhado da nota fiscal ou comprovante de compra.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Produtos que nao atenderem a essas condicoes poderao ser devolvidos
              ao consumidor com custo de reenvio por conta do destinatario.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">5. Reembolso</h2>
            <p className="text-muted-foreground leading-relaxed">
              O reembolso sera realizado pelo mesmo meio de pagamento utilizado na
              compra. Para pagamentos via Pix, o valor sera devolvido em ate 10 dias
              uteis apos o recebimento e conferencia do produto devolvido. O prazo
              para efetivo credito na conta do cliente depende do banco receptor e
              nao e de responsabilidade da Pelucia Pet.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Em caso de estorno parcial (ex.: produto com sinais de uso), o
              consumidor sera previamente informado e tera a opcao de aceitar
              ou cancelar o reembolso parcial.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">6. Custos de envio</h2>
            <p className="text-muted-foreground leading-relaxed">
              Em caso de vicio de fabricacao ou exercicio do direito de
              arrependimento dentro do prazo legal, o custo de envio de
              devolucao e por conta da Pelucia Pet. Em situacoes fora do
              escopo legal (ex.: troca por outro tamanho apos o prazo de
              arrependimento, ou arrependimento com produto em condicoes
              diferentes das exigidas), o custo de envio e de responsabilidade
              do consumidor.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold mb-3">7. Dados pessoais em devolucoes</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os dados pessoais fornecidos durante a compra (nome, telefone, e-mail
              e endereco) sao tratados conforme a nossa Politica de Privacidade.
              Em caso de devolucao, esses dados sao mantidos pelo periodo legal
              necessario para cumprimento de obrigacoes fiscais e de garantia,
              sendo descartados apos esse periodo. Veja mais na{' '}
              <a className="text-primary underline" href="/privacidade">Politica de Privacidade</a>.
            </p>
          </article>
        </section>

        <div className="mt-12 text-sm text-muted-foreground">
          <strong className="text-amber-800">TODO:</strong> informar{' '}
          <code className="bg-amber-100 px-1 rounded">CNPJ</code> e razao social
          da Pelucia Pet no rodape deste documento, conforme exige o CDC.
        </div>
      </main>
      <Footer />
    </>
  );
}
