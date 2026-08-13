// src/pages/FAQ.tsx
// Conteudo real (issue #45). Aviso de modelo juridico no topo.
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useStoreConfig } from '@/hooks/use-store-config';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Como escolher o tamanho da caminha?',
    a: 'O tamanho ideal depende do porte do seu pet e do jeito que ele gosta de deitar. Na pagina de cada produto voce encontra as opcoes disponiveis com as medidas em centimetros (ex.: 60x50, 70x60). Em caso de duvida entre dois tamanhos, prefira o maior: pets costumam preferir caminhas com folga para se acomodar.',
  },
  {
    q: 'Qual a diferenca entre Essencial e Premium?',
    a: 'A linha Essencial usa combinacoes de tecidos mais simples (Oxford e Tricoline) e a linha Premium combina tecidos mais macios e estruturados (Fleece, Plush, Carpete). Os dois niveis tem a mesma estrutura da caminha e a mesma garantia. A escolha e principalmente de toque e visual.',
  },
  {
    q: 'Quais tecidos estao disponiveis?',
    a: 'Trabalhamos com cinco tecidos: Oxford, Tricoline, Fleece, Plush e Carpete. Cada produto mostra quais tecidos estao disponiveis para aquela linha, com fotos e nomes das cores. A disponibilidade real aparece na pagina do produto, no seletor de tecido.',
  },
  {
    q: 'Posso escolher a cor do tecido?',
    a: 'Sim. Depois de escolher linha, tamanho e tecido, voce escolhe a cor entre as opcoes disponiveis para aquele tecido. As cores em estoque aparecem como opcoes clicaveis; cores indisponiveis aparecem esmaecidas.',
  },
  {
    q: 'Como funciona o pagamento via Pix?',
    a: 'O pagamento e feito via Pix direto para a Pelucia Pet. Clientes que pagam via Pix tem 5% de desconto sobre o preco a vista. O QR Code / copia e cola e enviado por WhatsApp na confirmacao do pedido.',
  },
  {
    q: 'Voces parcelam em cartao?',
    a: 'No momento nao oferecemos parcelamento em cartao. A compra e feita via Pix, a vista, com o desconto de 5% ja aplicado.',
  },
  {
    q: 'Qual o prazo de producao?',
    a: 'O prazo de producao e de ate 5 dias uteis apos a confirmacao do pagamento. Esse prazo e necessario para cortar, montar e revisar a caminha antes do envio.',
  },
  {
    q: 'Qual o prazo de envio?',
    a: 'O prazo de envio depende da transportadora e da regiao de entrega. Depois do despacho, voce recebe o codigo de rastreio por WhatsApp e pode acompanhar a entrega.',
  },
  {
    q: 'Como funciona o frete?',
    a: 'O frete e calculado com base no CEP de entrega e nas dimensoes do produto. O valor e informado antes da confirmacao do pedido, no WhatsApp, junto com o prazo estimado de entrega.',
  },
  {
    q: 'Como lavar a caminha?',
    a: 'A caminha tem capa removivel. Lave a capa a mao ou na maquina, em ciclo delicado, com agua fria e sabao neutro. Nao use alvejante. Nao coloque na secadora. O enchimento (espuma) nao precisa ser lavado com a mesma frequencia; basta arejar a caminha.',
  },
  {
    q: 'A capa e removivel?',
    a: 'Sim. A capa e fechada com ziper e pode ser retirada para lavagem. Isso facilita a limpeza e ajuda a manter a caminha higienica por mais tempo.',
  },
  {
    q: 'Como funciona a garantia?',
    a: 'A garantia e de 30 dias a partir do recebimento, cobrindo defeitos de fabricacao. Se voce identificar algum problema, entre em contato pelo WhatsApp com fotos do defeito e o numero do pedido. Em caso de vicio de fabricacao, o custo de envio de devolucao e por nossa conta. Veja mais detalhes na pagina de Trocas e Devolucoes.',
  },
  {
    q: 'Voces fazem sob medida?',
    a: 'Por enquanto, nao. Trabalhamos com tamanhos padronizados para manter o prazo de producao curto e o preco acessivel. Se precisar de algo especifico, fale com a gente pelo WhatsApp para avaliarmos.',
  },
];

export default function FAQ() {
  const { config: storeConfig } = useStoreConfig();
  return (
    <>
      <Helmet>
        <title>Perguntas Frequentes | Pelucia Pet</title>
        <meta name="description" content="Tire suas duvidas sobre tamanhos, tecidos, prazos, pagamento, frete e garantia das caminhas Pelucia Pet." />
        <link rel="canonical" href={`${storeConfig?.site_url || 'https://peluciapet.com.br'}/faq`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Perguntas Frequentes | Pelucia Pet" />
        <meta property="og:description" content="Tire suas duvidas sobre tamanhos, tecidos, prazos, pagamento, frete e garantia." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${storeConfig?.site_url || 'https://peluciapet.com.br'}/faq`} />
      </Helmet>
      <Header />
      <main className="container py-16 max-w-3xl">
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 mb-8 text-sm text-amber-900">
          <strong>Texto modelo</strong> — este conteudo foi gerado a partir de informacoes reais
          do projeto, mas <strong>nao substitui revisao juridica</strong>. Consulte um
          advogado antes de publicar oficialmente.
        </div>

        <h1 className="text-3xl font-bold font-serif mb-2">Perguntas Frequentes</h1>
        <p className="text-muted-foreground mb-8">
          Reunimos aqui as duvidas mais comuns sobre as caminhas Pelucia Pet. Se a sua pergunta
          nao estiver na lista, fale com a gente pelo WhatsApp.
        </p>

        <div className="space-y-6">
          {FAQ_ITEMS.map((item, idx) => (
            <section key={idx} className="border-b border-border pb-6 last:border-b-0">
              <h2 className="text-lg font-semibold mb-2">{item.q}</h2>
              <p className="text-muted-foreground leading-relaxed">{item.a}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
