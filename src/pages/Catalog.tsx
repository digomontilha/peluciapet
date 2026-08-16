import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Eye, Tag, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useStoreConfig } from '@/hooks/use-store-config';
// import banner from '@/assets/pelucia-pet-banner.png';
const banner = '/lovable-uploads/5a83c0d7-9107-43ae-aa06-700419a9adee.png';
interface Product {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  short_description?: string | null;
  observations?: string;
  is_custom_order: boolean;
  has_essential?: boolean;
  has_premium?: boolean;
  categories?: {
    name: string;
    icon: string;
  };
  product_images: Array<{
    id?: string;
    image_url: string;
    alt_text?: string;
    stock_quantity?: number;
    is_available?: boolean;
    color_id?: string | null;
  }>;
  product_prices: Array<{
    id?: string;
    price: number;
    pix_price?: number | null;
    commercial_line?: string | null;
    product_sizes?: {
      id?: string;
      name: string;
      dimensions: string;
      display_order?: number;
      width_cm?: number | null;
      height_cm?: number | null;
      depth_cm?: number | null;
    };
    sizes?: {
      name: string;
      dimensions: string;
    };
  }>;
}
interface Category {
  id: string;
  name: string;
  icon: string;
}
interface ColorRow {
  id: string;
  name: string;
  hex_code: string;
}
export default function Catalog() {
  const navigate = useNavigate();
  const { config: storeConfig } = useStoreConfig();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colorsById, setColorsById] = useState<Map<string, ColorRow>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(banner);

  // Hook para detectar tamanho da tela e trocar banner
  useEffect(() => {
    const updateBannerForScreen = () => {
      // Usar o mesmo banner para todas as resoluções
      setCurrentBanner('/lovable-uploads/0f657d4e-81af-4ebf-9fcb-96c97eae066a.png');
    };

    updateBannerForScreen();
    window.addEventListener('resize', updateBannerForScreen);

    return () => window.removeEventListener('resize', updateBannerForScreen);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      // Buscar dados em paralelo: produtos, categorias, cores (mapa)
      const [productsResult, categoriesResult, colorsResult] = await Promise.all([
        supabase.from('products').select(`
            id, name, slug, description, short_description, observations, is_custom_order, category_id,
            categories:category_id (name, icon),
            product_images (
              id, image_url, alt_text, stock_quantity, is_available, color_id
            ),
            product_prices (
              id, price, pix_price, commercial_line,
              product_sizes (
                id, name, dimensions, width_cm, height_cm, depth_cm, display_order
              )
            )
          `).eq('status', 'active').order('created_at', {
          ascending: false
        }),
        supabase.from('categories').select('*').order('name'),
        supabase.from('colors').select('id, name, hex_code').order('name')
      ]);
      if (productsResult.error) throw productsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      // Mapa de cores por id (pra aria-label das bolinhas)
      const colorsMap = new Map<string, ColorRow>();
      (colorsResult.data || []).forEach((c) => colorsMap.set(c.id, c as ColorRow));
      setColorsById(colorsMap);

      // Processar produtos: marca has_essential/has_premium via subquery JS
      // (subquery no select do PostgREST exigiria 2 round-trips extras; aqui
      // derivamos do product_fabrics via lookup paralelo)
      const productIds = (productsResult.data || []).map((p) => p.id);
      const { data: pfData } = await supabase
        .from('product_fabrics')
        .select('product_id, fabrics:commercial_line')
        .in('product_id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000']);
      const fabricByProduct = new Map<string, { essential: boolean; premium: boolean }>();
      ((pfData || []) as Array<{ product_id: string; fabrics: 'essential' | 'premium' | null }>).forEach((row) => {
        const cur = fabricByProduct.get(row.product_id) || { essential: false, premium: false };
        if (row.fabrics === 'essential') cur.essential = true;
        if (row.fabrics === 'premium') cur.premium = true;
        fabricByProduct.set(row.product_id, cur);
      });

      const processedProducts = (productsResult.data || []).map(product => {
        const lineFlags = fabricByProduct.get(product.id) || { essential: false, premium: false };
        return {
          ...product,
          has_essential: lineFlags.essential,
          has_premium: lineFlags.premium,
          product_prices: (product.product_prices || []).map(price => ({
            ...price,
            sizes: price.product_sizes ? {
              id: price.product_sizes.id,
              name: price.product_sizes.name,
              dimensions: price.product_sizes.dimensions,
              display_order: price.product_sizes.display_order,
              width_cm: price.product_sizes.width_cm,
              height_cm: price.product_sizes.height_cm,
              depth_cm: price.product_sizes.depth_cm
            } : undefined
          }))
        };
      });
      setProducts(processedProducts);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar o catálogo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const filteredProducts = products.filter(product => selectedCategory === 'all' || product.categories?.name === selectedCategory);
  const getProductImage = (product: Product) => {
    return product.product_images[0]?.image_url || '/placeholder.svg';
  };
  const goToProduct = (product: Product) => {
    const slug = product.slug || product.id;
    navigate(`/produto/${slug}`);
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-soft">
        <Header />
        <div className="container py-12">
          {/* Skeleton grid */}
          <div className="mb-10">
            <div className="h-8 w-64 bg-muted rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-48 bg-muted/60 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border/50">
                <div className="aspect-square bg-muted animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-muted/60 rounded animate-pulse" />
                  <div className="h-5 w-1/2 bg-muted rounded animate-pulse mt-3" />
                  <div className="flex gap-1.5 pt-2">
                    <div className="h-9 flex-1 bg-muted/60 rounded-xl animate-pulse" />
                    <div className="h-9 flex-1 bg-muted/60 rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-soft">
      <Helmet>
        <title>Caminhas para Pets | Pelucia Pet</title>
        <meta
          name="description"
          content="Caminhas para pets em diferentes tamanhos, tecidos e cores. Escolha sua combinacao e finalize o pedido com atendimento pelo WhatsApp."
        />
        <link rel="canonical" href={`${storeConfig?.site_url || 'https://peluciapet.com.br'}/`} />
        <meta property="og:title" content="Caminhas para Pets | Pelucia Pet" />
        <meta property="og:description" content="Caminhas para pets em diferentes tamanhos, tecidos e cores." />
        <meta property="og:url" content={`${storeConfig?.site_url || 'https://peluciapet.com.br'}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pt_BR" />
      </Helmet>
      <Header />

      {/* Hero Section - Compacto com proposta de valor e 1 CTA forte */}
      <section className="relative min-h-[120px] sm:min-h-[150px] lg:min-h-[180px] overflow-hidden" style={{
      backgroundImage: `url(${currentBanner})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
        {/* Gradient overlay pra legibilidade do texto sobre o pattern - mais suave */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/25 pointer-events-none" />

        {/* Conteúdo principal */}
        <div className="relative z-20 container min-h-[120px] sm:min-h-[150px] lg:min-h-[180px] flex items-center justify-center py-4 sm:py-5 lg:py-6 px-4">
          <div className="text-center space-y-2 sm:space-y-3 max-w-3xl mx-auto">

            {/* Headline com proposta de valor - hierarquia melhorada */}
            <h1 className="font-serif text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white leading-tight px-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              Caminhas para o conforto que seu pet merece
            </h1>

            {/* Sub: beneficios especificos - mais legível */}
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white leading-snug px-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] font-normal">
              Modelos, tamanhos e estilos para diferentes tipos de pets
            </p>

            {/* CTA único forte - área de toque melhorada */}
            <div className="pt-2 sm:pt-3">
              <Button
                onClick={() => document.querySelector('.grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-pet-gold hover:bg-pet-gold/90 text-pet-brown-dark px-6 sm:px-8 min-h-[48px] sm:min-h-[50px] h-12 sm:h-11 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
              >
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Ver Caminhas
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-12">
        {/* Filtros de categoria */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-base sm:text-2xl font-bold text-foreground leading-tight">
              Explore por categoria
              <span className="ml-1.5 sm:ml-2 text-xs sm:text-base font-normal text-muted-foreground">
                ({products.length})
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Encontre o produto perfeito pro seu pet</p>
          </div>

          {/* Mobile: chips horizontais com scroll-snap (substitui o Sheet) */}
          <div
            className="md:hidden -mx-4 px-4 overflow-x-auto pb-1 flex gap-2 snap-x snap-mandatory"
            role="group"
            aria-label="Filtrar por categoria"
          >
            <button
              onClick={() => setSelectedCategory('all')}
              aria-pressed={selectedCategory === 'all'}
              className={`snap-start shrink-0 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === 'all'
                ? 'bg-pet-brown-dark text-white shadow-md'
                : 'bg-card border border-border'}`}
            >
              <span className="text-base" aria-hidden>🏪</span>
              <span>Todos</span>
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                aria-pressed={selectedCategory === category.name}
                className={`snap-start shrink-0 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === category.name
                  ? 'bg-pet-brown-dark text-white shadow-md'
                  : 'bg-card border border-border'}`}
              >
                <span className="text-base" aria-hidden>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Desktop: chips com flex-wrap */}
          <div className="hidden md:flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              aria-pressed={selectedCategory === 'all'}
              className={`group inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === 'all'
                ? 'bg-pet-brown-dark text-white shadow-md scale-105'
                : 'bg-card border border-border hover:border-pet-brown-dark hover:bg-pet-brown-dark hover:text-white'}`}
            >
              <span className="text-base" aria-hidden>🏪</span>
              <span>Todos os produtos</span>
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                aria-pressed={selectedCategory === category.name}
                className={`group inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === category.name
                  ? 'bg-pet-brown-dark text-white shadow-md scale-105'
                  : 'bg-card border border-border hover:border-pet-brown-dark hover:bg-pet-brown-dark hover:text-white'}`}
              >
                <span className="text-base" aria-hidden>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid de produtos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={goToProduct}
              colorsById={colorsById}
              pixDiscountPercent={storeConfig?.pix_discount_percent ?? 5}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-pet-beige-light mb-4">
              <svg className="w-10 h-10 text-pet-brown-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Nenhum produto por aqui</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Não encontramos produtos nessa categoria. Que tal explorar as outras?
            </p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pet-brown-dark text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Ver todos os produtos
            </button>
          </div>
        )}
      </div>

      {/* Modal de detalhes do produto - removido na issue #33. Agora cada card
          navega direto pra /produto/:slug. */}

      {/* Seção de Benefícios - copy de venda real */}
      <section className="bg-pet-beige-light/30 py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Por que escolher a PelúciaPet</h2>
            <p className="text-sm text-muted-foreground mt-1">Caminhas pensadas pro bem-estar do seu pet</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="group bg-card rounded-2xl p-5 sm:p-6 text-center border border-border/50 hover:border-pet-gold/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-pet-gold/15 group-hover:bg-pet-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors duration-300">
                <svg className="h-6 w-6 text-pet-brown-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Tecido macio</h3>
              <p className="text-xs text-muted-foreground leading-snug">Toque suave, pensado pro descanso do pet</p>
            </div>

            <div className="group bg-card rounded-2xl p-5 sm:p-6 text-center border border-border/50 hover:border-pet-gold/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-pet-gold/15 group-hover:bg-pet-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors duration-300">
                <svg className="h-6 w-6 text-pet-brown-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Lavável na máquina</h3>
              <p className="text-xs text-muted-foreground leading-snug">Capa com zíper, fácil de higienizar</p>
            </div>

            <div className="group bg-card rounded-2xl p-5 sm:p-6 text-center border border-border/50 hover:border-pet-gold/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-pet-gold/15 group-hover:bg-pet-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors duration-300">
                <svg className="h-6 w-6 text-pet-brown-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Enchimento confortavel</h3>
              <p className="text-xs text-muted-foreground leading-snug">Mantem o formato e acomoda bem o pet</p>
            </div>

            <div className="group bg-card rounded-2xl p-5 sm:p-6 text-center border border-border/50 hover:border-pet-gold/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-pet-gold/15 group-hover:bg-pet-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors duration-300">
                <svg className="h-6 w-6 text-pet-brown-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                  <path d="M15 18H9" />
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                  <circle cx="17" cy="18" r="2" />
                  <circle cx="7" cy="18" r="2" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Envio por transportadora</h3>
              <p className="text-xs text-muted-foreground leading-snug">Codigo de rastreio enviado por WhatsApp</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar - sinais de confianca (todos verificaveis, sem numeros inventados) */}
      <section className="bg-pet-brown-dark text-white py-10">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-pet-gold">5 dias</div>
              <div className="text-xs sm:text-sm text-white/80">Producao</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-pet-gold">5%</div>
              <div className="text-xs sm:text-sm text-white/80">Pix off</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-serif font-bold text-pet-gold">1 mes</div>
              <div className="text-xs sm:text-sm text-white/80">Garantia</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-400" />
              </div>
              <div className="text-xs sm:text-sm text-white/80">Atendimento WhatsApp</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
}
interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  colorsById: Map<string, ColorRow>;
  pixDiscountPercent: number;
}
function ProductCard({
  product,
  onViewDetails,
  colorsById,
  pixDiscountPercent
}: ProductCardProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isLiked, setIsLiked] = useState(false);

  // Filtrar apenas imagens disponíveis
  const availableImages = product.product_images.filter(img => img.is_available !== false);
  const currentImage = availableImages[selectedImageIndex]?.image_url || availableImages[0]?.image_url;

  // Badge de linha: calculado a partir de has_essential/has_premium
  const hasEssential = product.has_essential;
  const hasPremium = product.has_premium;
  const lineBadge = hasEssential && hasPremium
    ? 'Essencial • Premium'
    : hasPremium
      ? 'Premium'
      : hasEssential
        ? 'Essencial'
        : null;

  // Preço inicial: menor price entre product_prices com commercial_line populado
  // pix_price é o valor com desconto Pix (vem do banco)
  const pricedEntries = product.product_prices.filter(p => p.commercial_line != null && p.price > 0);
  const minPriceEntry = pricedEntries.length
    ? pricedEntries.reduce((min, p) => (p.price < min.price ? p : min), pricedEntries[0])
    : null;
  const hasAnyPrice = !!minPriceEntry;
  const minPrice = minPriceEntry?.price ?? 0;
  const minPixPrice = minPriceEntry?.pix_price ?? null;

  // Tamanhos: lista única de product_sizes, ordenada por display_order
  const uniqueSizes = Array.from(
    new Map(
      product.product_prices
        .map(p => p.product_sizes)
        .filter((s): s is NonNullable<typeof s> => !!s)
        .map(s => [s.id || s.name, s])
    ).values()
  ).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const displaySizes = uniqueSizes.slice(0, 4);
  const moreSizes = uniqueSizes.length - displaySizes.length;

  // Cores: pega nome real via colorsById
  const colorIds = Array.from(new Set(availableImages.map(i => i.color_id).filter(Boolean)));
  const availableColors = colorIds
    .map((id): ColorRow | null => colorsById.get(id as string) || null)
    .filter((c): c is ColorRow => !!c);

  return (
    <div
      onClick={() => onViewDetails(product)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewDetails(product); } }}
      role="button"
      tabIndex={0}
      aria-label={`Ver opções de ${product.name}`}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-pet-gold/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pet-beige-light via-pet-beige-medium/30 to-pet-beige-medium">
        <img
          src={currentImage || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Category icon (top-left) */}
        {product.categories && (
          <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-base shadow-md ring-1 ring-black/5">
            <span aria-hidden>{product.categories.icon}</span>
          </div>
        )}

        {/* Line badge (top-right) - Essencial / Premium */}
        {lineBadge && (
          <div className="absolute top-2 right-2 bg-pet-gold/95 text-pet-brown-dark text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-md ring-1 ring-black/5 max-w-[60%] truncate">
            {lineBadge}
          </div>
        )}

        {/* Like button (right side, below badge if present) */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
          aria-label={isLiked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-pressed={isLiked}
          className={`absolute ${lineBadge ? 'top-12' : 'top-2'} right-2 bg-card/90 backdrop-blur-sm rounded-full w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-md ring-1 ring-black/5 hover:bg-card hover:scale-110 transition-all duration-200`}
        >
          <Heart
            className={`h-5 w-5 transition-all duration-200 ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-muted-foreground'}`}
          />
        </button>

        {/* Custom order badge (bottom-left) */}
        {product.is_custom_order && (
          <div className="absolute bottom-2 left-2 bg-pet-brown-dark/95 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-md ring-1 ring-black/5 flex items-center gap-1">
            <Tag className="h-2.5 w-2.5" />
            Sob encomenda
          </div>
        )}

        {/* Color swatches overlay (bottom-right) - aria-label com nome real */}
        {availableColors.length > 0 && (
          <div className="absolute inset-x-2 bottom-2 flex justify-end pointer-events-none">
            <div className="flex gap-1 sm:gap-1.5 bg-card/80 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-1 sm:py-1.5 shadow-md ring-1 ring-black/5 pointer-events-auto max-w-full">
              {availableColors.slice(0, 4).map((color, idx) => (
                <button
                  key={color.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                  aria-label={`Selecionar cor ${color.name}`}
                  aria-pressed={selectedImageIndex === idx}
                  className={`w-6 h-6 sm:w-7 sm:h-7 min-w-[24px] min-h-[24px] sm:min-w-[28px] sm:min-h-[28px] rounded-full overflow-hidden transition-all duration-200 shrink-0 ${selectedImageIndex === idx
                    ? 'ring-2 ring-pet-gold ring-offset-1 scale-110'
                    : 'ring-1 ring-black/10 hover:scale-110'}`}
                  style={{ backgroundColor: color.hex_code }}
                  title={color.name}
                />
              ))}
              {availableColors.length > 4 && (
                <div className="w-6 h-6 sm:w-7 sm:h-7 min-w-[24px] min-h-[24px] sm:min-w-[28px] sm:min-h-[28px] rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                  +{availableColors.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="p-3 space-y-1.5">
        {/* Title + description */}
        <div>
          <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-pet-brown-dark transition-colors min-w-0 break-words">
            {product.name}
          </h3>
          {product.short_description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-0.5">
              {product.short_description}
            </p>
          )}
        </div>

        {/* Tamanhos: chips horizontais */}
        {displaySizes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mr-0.5">Tamanhos</span>
            {displaySizes.map((size) => (
              <span
                key={size.id || size.name}
                className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md bg-muted text-[11px] font-semibold text-foreground"
                title={size.dimensions}
              >
                {size.name}
              </span>
            ))}
            {moreSizes > 0 && (
              <span className="text-[10px] text-muted-foreground font-medium">+{moreSizes}</span>
            )}
          </div>
        )}

        {/* Preço inicial: "A partir de R$ X" + "R$ Y no Pix" */}
        {hasAnyPrice ? (
          <div className="pt-0.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">A partir de</div>
            <div className="text-base sm:text-lg font-bold text-emerald-700 leading-tight">
              R$ {minPrice.toFixed(2)}
            </div>
            {minPixPrice && minPixPrice < minPrice && (
              <div className="text-[11px] text-emerald-700 font-medium leading-tight">
                R$ {minPixPrice.toFixed(2)} no Pix
                <span className="text-muted-foreground ml-1">({pixDiscountPercent}% off)</span>
              </div>
            )}
          </div>
        ) : (
          <div className="pt-0.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Preço</div>
            <div className="text-sm font-semibold text-muted-foreground">Consulte</div>
          </div>
        )}

        {/* Observations (compact, italic) */}
        {product.observations && (
          <p className="text-orange-700 text-[10px] font-medium line-clamp-1 italic pt-0.5">
            {product.observations}
          </p>
        )}

        {/* Action Button - leva pra página de seleção (issue #33) */}
        <div className="pt-1">
          <Button
            onClick={(e) => { e.stopPropagation(); onViewDetails(product); }}
            className="w-full min-h-[44px] h-11 text-xs sm:text-sm font-semibold bg-pet-brown-dark hover:bg-pet-brown-medium text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            aria-label={`Ver opções de ${product.name}`}
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" aria-hidden />
            Ver opções
          </Button>
        </div>
      </div>
    </div>
  );
}
function Label({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}