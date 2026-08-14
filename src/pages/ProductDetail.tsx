// src/pages/ProductDetail.tsx
// Pagina individual de produto em /produto/:slug.
// Jornada: linha -> tamanho -> tecido -> cor -> preco -> WhatsApp.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, Heart, MessageCircle, Ruler, Tag, Info, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useStoreConfig } from '@/hooks/use-store-config';
import { supabase } from '@/integrations/supabase/client';

type CommercialLine = 'essential' | 'premium';

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  observations: string | null;
  slug: string;
  short_description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  product_code: string | null;
  is_custom_order: boolean | null;
  category_id: string | null;
  categories?: { name: string; icon: string | null } | null;
}

interface ImageRow {
  id: string;
  image_url: string;
  alt_text: string | null;
  color_id: string | null;
  display_order: number | null;
  is_available: boolean | null;
}

interface SizeRow {
  id: string;
  name: string;
  dimensions: string;
  width_cm: number | null;
  height_cm: number | null;
  depth_cm: number | null;
  display_order: number;
}

interface PriceRow {
  id: string;
  product_id: string;
  product_size_id: string | null;
  commercial_line: string | null;
  fabric_id: string | null;
  price: number;
  pix_price: number | null;
}

interface FabricRow {
  id: string;
  name: string;
  commercial_line: string;
  description: string | null;
  display_order: number;
}

interface ProductFabricRow {
  fabric_id: string;
  is_available: boolean | null;
  display_order: number;
  fabrics: FabricRow | null;
}

interface ColorRow {
  id: string;
  name: string;
  hex_code: string;
}

const formatMoney = (value: number) => new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { config: storeConfig } = useStoreConfig();

  // Data
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [sizes, setSizes] = useState<SizeRow[]>([]);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [productFabrics, setProductFabrics] = useState<ProductFabricRow[]>([]);
  const [fabrics, setFabrics] = useState<FabricRow[]>([]);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selection
  const [selectedLine, setSelectedLine] = useState<CommercialLine | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  // Carrega dados
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const { data: p, error: pErr } = await supabase
          .from('products')
          .select('*, categories:category_id(name, icon)')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();
        if (cancelled) return;
        if (pErr) throw pErr;
        if (!p) { setLoadError('Produto nao encontrado.'); setLoading(false); return; }
        setProduct(p as ProductRow);

        const [imgsRes, szsRes, prsRes, pfsRes, fbsRes] = await Promise.all([
          supabase.from('product_images').select('*').eq('product_id', p.id).order('display_order'),
          supabase.from('product_sizes').select('*').eq('product_id', p.id).order('display_order'),
          supabase.from('product_prices').select('*').eq('product_id', p.id),
          supabase.from('product_fabrics').select('fabric_id, is_available, display_order, fabrics:fabric_id(*)').eq('product_id', p.id).order('display_order'),
          supabase.from('fabrics').select('*').eq('is_active', true).order('commercial_line, display_order'),
        ]);

        if (cancelled) return;
        setImages(((imgsRes.data || []) as ImageRow[]).filter((image) => image.is_available !== false));
        setSizes((szsRes.data || []) as SizeRow[]);
        setPrices((prsRes.data || []) as PriceRow[]);
        setProductFabrics(((pfsRes.data || []) as Array<{ fabric_id: string; is_available: boolean | null; display_order: number; fabrics: FabricRow | null }>).map((row) => ({
          fabric_id: row.fabric_id,
          is_available: row.is_available,
          display_order: row.display_order,
          fabrics: row.fabrics,
        })));
        setFabrics((fbsRes.data || []) as FabricRow[]);

        const colorIds = Array.from(new Set((imgsRes.data || []).filter((i) => (i as ImageRow).is_available !== false).map((i) => (i as ImageRow).color_id).filter((id): id is string => !!id)));
        if (colorIds.length > 0) {
          const { data: cls } = await supabase.from('colors').select('*').in('id', colorIds).order('name');
          if (!cancelled) setColors((cls || []) as ColorRow[]);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Erro ao carregar produto.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const availableLines = useMemo(() => (['essential', 'premium'] as CommercialLine[]).filter((line) =>
    productFabrics.some((association) => association.is_available !== false && association.fabrics?.commercial_line === line)
  ), [productFabrics]);

  // Tecidos disponiveis para a linha escolhida
  const availableFabrics = useMemo(() => {
    if (!selectedLine) return [] as FabricRow[];
    return productFabrics
      .filter((pf) => pf.is_available !== false && pf.fabrics?.commercial_line === selectedLine)
      .map((pf) => pf.fabrics)
      .filter((f): f is FabricRow => !!f);
  }, [productFabrics, selectedLine]);

  // Seleciona automaticamente etapas com uma única opção válida.
  useEffect(() => {
    if (availableLines.length === 1) setSelectedLine(availableLines[0]);
    else if (selectedLine && !availableLines.includes(selectedLine)) setSelectedLine(null);
  }, [availableLines, selectedLine]);

  useEffect(() => {
    if (sizes.length === 1) setSelectedSizeId(sizes[0].id);
    else if (selectedSizeId && !sizes.some((size) => size.id === selectedSizeId)) setSelectedSizeId(null);
  }, [selectedSizeId, sizes]);

  useEffect(() => {
    if (availableFabrics.length === 1) setSelectedFabricId(availableFabrics[0].id);
    else if (selectedFabricId && !availableFabrics.some((fabric) => fabric.id === selectedFabricId)) setSelectedFabricId(null);
  }, [availableFabrics, selectedFabricId]);

  useEffect(() => {
    if (colors.length === 1) setSelectedColorId(colors[0].id);
    else if (selectedColorId && !colors.some((color) => color.id === selectedColorId)) setSelectedColorId(null);
  }, [colors, selectedColorId]);

  // Preco atual baseado em linha + tamanho + tecido
  const currentPrice = useMemo(() => {
    if (!selectedSizeId || !selectedLine) return null;
    const candidates = prices.filter((p) =>
      p.product_size_id === selectedSizeId && p.commercial_line === selectedLine
    );
    if (candidates.length === 0) return null;
    // Se tecido selecionado, tenta achar preco com esse tecido
    if (selectedFabricId) {
      const withFabric = candidates.find((p) => p.fabric_id === selectedFabricId);
      if (withFabric) return withFabric;
    }
    // Senao, pega o primeiro sem tecido (preco "geral" da linha)
    return candidates.find((p) => p.fabric_id === null) || candidates[0];
  }, [prices, selectedSizeId, selectedLine, selectedFabricId]);

  const selectedSize = sizes.find((s) => s.id === selectedSizeId) || null;
  const selectedFabric = fabrics.find((f) => f.id === selectedFabricId) || null;
  const selectedColor = colors.find((c) => c.id === selectedColorId) || null;

  // Trocar imagem principal quando cor muda
  useEffect(() => {
    if (!selectedColorId) return;
    const idx = images.findIndex((i) => i.color_id === selectedColorId);
    if (idx >= 0) setMainImageIdx(idx);
  }, [selectedColorId, images]);

  // Sticky CTA (mobile)
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // JSON-LD Product (apenas quando tem preco)
  const productJsonLd = useMemo(() => {
    if (!product || !storeConfig || !currentPrice) return null;
    const ogImage = images[0]?.image_url || '';
    const canonicalUrl = `${storeConfig.site_url}/produto/${product.slug}`;
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.meta_description || product.short_description || product.description?.substring(0, 200) || product.name,
      image: ogImage,
      brand: { '@type': 'Brand', name: 'Pelucia Pet' },
      offers: {
        '@type': 'Offer',
        price: (currentPrice.pix_price || currentPrice.price).toFixed(2),
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
        url: canonicalUrl,
        seller: { '@type': 'Organization', name: 'Pelucia Pet' }
      }
    };
  }, [product, images, currentPrice, storeConfig]);

  // Mensagem WhatsApp
  const buildWhatsAppUrl = (): string | null => {
    if (!product || !storeConfig || !currentPrice) return null;
    const lineLabel = selectedLine === 'essential' ? 'Essencial' : 'Premium';
    const sizeText = selectedSize ? `${selectedSize.name} (${selectedSize.dimensions})` : '';
    const fabricText = selectedFabric?.name || '';
    const colorText = selectedColor?.name || '';
    const priceText = `R$ ${formatMoney(currentPrice.price)}`;
    const pixText = currentPrice.pix_price
      ? `R$ ${formatMoney(currentPrice.pix_price)}`
      : '';
    const canonicalUrl = `${storeConfig.site_url}/produto/${product.slug}`;

    const lines = [
      'Olá! Tenho interesse nesta caminha da Pelúcia Pet.',
      '',
      `Produto: ${product.name}`,
      `Categoria: ${product.categories?.name || 'Não informada'}`,
      `Linha: ${lineLabel}`,
    ];
    if (sizeText) lines.push(`Tamanho: ${sizeText}`);
    if (fabricText) lines.push(`Tecido: ${fabricText}`);
    if (colorText) lines.push(`Cor: ${colorText}`);
    lines.push(`Preço: ${priceText}`);
    if (pixText) lines.push(`Pix: ${pixText}`);
    if (product.product_code) lines.push(`Código: ${product.product_code}`);
    lines.push(`Link: ${canonicalUrl}`);
    lines.push('', 'Pode me ajudar a finalizar o pedido?');

    return `https://wa.me/${storeConfig.whatsapp_number}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const handleWhatsApp = () => {
    const url = buildWhatsAppUrl();
    if (url) window.open(url, '_blank');
  };

  const canCheckout = !!(selectedLine && selectedSizeId && selectedFabricId && currentPrice && (colors.length === 0 || selectedColorId));
  const isReady = !loading && !loadError && product;
  const mainImage = images[mainImageIdx] || images[0];
  const startingPrice = prices.filter((price) => price.price > 0 && price.commercial_line).sort((a, b) => a.price - b.price)[0] || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-3">Produto nao encontrado</h1>
          <p className="text-muted-foreground mb-6">{loadError || 'Verifique o link e tente novamente.'}</p>
          <Button onClick={() => navigate('/')}>Voltar ao catalogo</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const descriptionText = product.short_description || product.description?.split('\n')[0] || '';
  const fullDescription = product.short_description ? product.description : null;
  const ogImageAbs = mainImage?.image_url || (storeConfig?.og_image_url ?? '');

  return (
    <>
      <Helmet>
        <title>{`${product.meta_title || product.name} | Pelucia Pet`}</title>
        <meta
          name="description"
          content={product.meta_description || product.short_description || product.description?.substring(0, 140) || product.name}
        />
        <link rel="canonical" href={`${storeConfig?.site_url || ''}/produto/${product.slug}`} />
        <meta property="og:title" content={`${product.name} | Pelucia Pet`} />
        <meta property="og:description" content={product.meta_description || product.short_description || ''} />
        <meta property="og:url" content={`${storeConfig?.site_url || ''}/produto/${product.slug}`} />
        {ogImageAbs && <meta property="og:image" content={ogImageAbs} />}
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={(currentPrice?.pix_price || currentPrice?.price || 0).toFixed(2)} />
        <meta property="product:price:currency" content="BRL" />
        {productJsonLd && (
          <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
        )}
      </Helmet>

      <Header />

      <main className="bg-background">
        <div className="container py-4">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
            <Link to="/" className="hover:text-foreground transition-colors">Catalogo</Link>
            {product.categories?.name && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span>{product.categories.name}</span>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground truncate max-w-[60vw] sm:max-w-xs">{product.name}</span>
          </nav>
        </div>

        <div className="container pb-24 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Galeria */}
            <div className="space-y-3">
              <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
                {mainImage ? (
                  <img
                    src={mainImage.image_url}
                    alt={mainImage.alt_text || product.name}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sem foto disponivel
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.slice(0, 5).map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setMainImageIdx(idx)}
                      aria-label={`Ver foto ${idx + 1}`}
                      aria-pressed={mainImageIdx === idx}
                      className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                        mainImageIdx === idx ? 'border-pet-gold' : 'border-transparent hover:border-border'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info + Seletores */}
            <div className="space-y-6">
              {product.categories && (
                <Badge variant="outline" className="text-xs">
                  {product.categories.icon && <span className="mr-1" aria-hidden>{product.categories.icon}</span>}
                  {product.categories.name}
                </Badge>
              )}

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground leading-tight">
                  {product.name}
                </h1>
                {descriptionText && (
                  <p className="text-muted-foreground mt-2 text-sm sm:text-base">{descriptionText}</p>
                )}
                {fullDescription && (
                  <p className="text-muted-foreground mt-2 text-sm whitespace-pre-line">{fullDescription}</p>
                )}
                {product.is_custom_order && (
                  <Badge className="bg-pet-gold text-pet-brown-dark mt-2">
                    <Tag className="h-3 w-3 mr-1" />
                    Produzido sob encomenda
                  </Badge>
                )}
              </div>

              {/* Seletor 1: Linha */}
              {availableLines.length > 1 && (
                <fieldset>
                  <legend className="text-sm font-semibold mb-2">1. Escolha a linha</legend>
                  <div className="grid grid-cols-2 gap-2">
                  {availableLines.map((line) => {
                    const isSelected = selectedLine === line;
                    return (
                      <button
                        key={line}
                        type="button"
                        onClick={() => setSelectedLine(line)}
                        aria-pressed={isSelected}
                        className={`text-left p-3 sm:p-4 rounded-xl border-2 transition-all min-h-[44px] ${
                          isSelected
                            ? 'border-pet-gold bg-pet-gold/10'
                            : 'border-border hover:border-pet-brown-dark/40'
                        }`}
                      >
                        <div className="font-bold text-sm">
                          {line === 'essential' ? 'Essencial' : 'Premium'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {line === 'essential'
                            ? 'Pratica e confortavel'
                            : 'Texturas mais macias e acabamento diferenciado'}
                        </div>
                      </button>
                    );
                  })}
                  </div>
                </fieldset>
              )}
              {availableLines.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma linha comercial disponível para este produto.</p>
              )}

              {/* Seletor 2: Tamanho */}
              {selectedLine && sizes.length > 1 && (
                <fieldset>
                  <legend className="text-sm font-semibold mb-2">2. Escolha o tamanho</legend>
                  <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => {
                        const isSelected = selectedSizeId === size.id;
                        const sizePrice = prices.find((p) =>
                          p.product_size_id === size.id && p.commercial_line === selectedLine
                        );
                        return (
                          <button
                            key={size.id}
                            type="button"
                            onClick={() => setSelectedSizeId(size.id)}
                            aria-pressed={isSelected}
                            className={`px-3 py-2 rounded-lg border-2 text-left min-h-[44px] transition-all ${
                              isSelected
                                ? 'border-pet-gold bg-pet-gold/10'
                                : 'border-border hover:border-pet-brown-dark/40'
                            }`}
                          >
                            <div className="font-bold text-sm">{size.name}</div>
                            <div className="text-[11px] text-muted-foreground">{size.dimensions}</div>
                            {sizePrice && (
                              <div className="text-xs font-medium text-emerald-700 mt-0.5">
                                R$ {formatMoney(sizePrice.price)}
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>

                  <Collapsible open={sizeGuideOpen} onOpenChange={setSizeGuideOpen} className="mt-3">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
                      >
                        <Ruler className="h-3.5 w-3.5" />
                        Qual tamanho escolher?
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="text-xs text-muted-foreground mt-2 p-3 bg-muted/40 rounded-lg space-y-2">
                      <p>1. Mea o pet deitado, do focinho ate a base da cauda.</p>
                      <p>2. Acrescente espaco para ele se acomodar e se movimentar.</p>
                      <p>3. Em caso de duvida entre dois tamanhos, prefira o maior.</p>
                    </CollapsibleContent>
                  </Collapsible>
                </fieldset>
              )}

              {/* Seletor 3: Tecido */}
              {selectedLine && selectedSizeId && availableFabrics.length > 1 && (
                <fieldset>
                  <legend className="text-sm font-semibold mb-2">3. Escolha o tecido</legend>
                  <div className="space-y-2">
                      {availableFabrics.map((fabric) => {
                        const isSelected = selectedFabricId === fabric.id;
                        return (
                          <button
                            key={fabric.id}
                            type="button"
                            onClick={() => setSelectedFabricId(fabric.id)}
                            aria-pressed={isSelected}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all min-h-[44px] ${
                              isSelected
                                ? 'border-pet-gold bg-pet-gold/10'
                                : 'border-border hover:border-pet-brown-dark/40'
                            }`}
                          >
                            <div className="font-semibold text-sm">{fabric.name}</div>
                            {fabric.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">{fabric.description}</div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </fieldset>
              )}
              {selectedLine && sizes.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum tamanho disponível para este produto.</p>
              )}
              {selectedLine && selectedSizeId && availableFabrics.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum tecido disponível para esta linha.</p>
              )}

              {/* Seletor 4: Cor */}
              {selectedLine && selectedSizeId && selectedFabricId && colors.length > 1 && (
                <fieldset>
                  <legend className="text-sm font-semibold mb-2">4. Escolha a cor</legend>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => {
                      const isSelected = selectedColorId === color.id;
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setSelectedColorId(isSelected ? null : color.id)}
                          aria-label={`Selecionar cor ${color.name}`}
                          title={`Selecionar cor ${color.name}`}
                          aria-pressed={isSelected}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 min-h-[44px] transition-all ${
                            isSelected
                              ? 'border-pet-gold bg-pet-gold/10'
                              : 'border-border hover:border-pet-brown-dark/40'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-border"
                            style={{ backgroundColor: color.hex_code }}
                            aria-hidden
                          />
                          <span className="text-sm">{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              {selectedLine && selectedSizeId && selectedFabricId && colors.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma cor disponível para este produto.</p>
              )}

              {/* Preco */}
              <div className="pt-4 border-t" aria-live="polite">
                {currentPrice ? (
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold text-foreground">
                      R$ {formatMoney(currentPrice.price)}
                    </div>
                    {currentPrice.pix_price && storeConfig && (
                      <div className="text-sm text-emerald-700 font-medium mt-1">
                        R$ {formatMoney(currentPrice.pix_price)} no Pix
                        <span className="text-xs text-muted-foreground ml-1">
                          ({storeConfig.pix_discount_percent}% de desconto)
                        </span>
                      </div>
                    )}
                  </div>
                ) : selectedLine && selectedSizeId ? (
                  <p className="text-sm text-muted-foreground">Preço ainda não cadastrado para esta combinação.</p>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {startingPrice ? (
                      <>
                        <p>A partir de R$ {formatMoney(startingPrice.price)}</p>
                        {startingPrice.pix_price && <p className="text-emerald-700">R$ {formatMoney(startingPrice.pix_price)} no Pix</p>}
                      </>
                    ) : <p>Preço ainda não cadastrado.</p>}
                  </div>
                )}
              </div>

              {/* CTA desktop */}
              <div className="hidden md:block pt-2">
                <Button
                  onClick={handleWhatsApp}
                  disabled={!canCheckout}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[48px] h-12 text-base rounded-xl shadow-sm"
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {canCheckout ? 'Comprar pelo WhatsApp' : 'Complete as escolhas'}
                </Button>
                {!canCheckout && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Selecione linha, tamanho, tecido{colors.length > 0 ? ' e cor' : ''}.
                  </p>
                )}
              </div>

              {/* Observacoes */}
              {product.observations && (
                <div className="text-xs sm:text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <Info className="h-3.5 w-3.5 inline mr-1.5" />
                  {product.observations}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky CTA mobile */}
        {canCheckout && (
          <div
            className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t p-3 shadow-lg transition-transform ${
              showSticky ? 'translate-y-0' : 'translate-y-full'
            }`}
            aria-hidden={!showSticky}
          >
            <Button
              onClick={handleWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[48px] h-12 rounded-xl"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Comprar pelo WhatsApp
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
