import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MessageCircle, Eye, Tag, Heart, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
// import banner from '@/assets/pelucia-pet-banner.png';
const banner = '/lovable-uploads/5a83c0d7-9107-43ae-aa06-700419a9adee.png';
interface Product {
  id: string;
  name: string;
  description: string;
  observations?: string;
  is_custom_order: boolean;
  categories?: {
    name: string;
    icon: string;
  };
  product_images: Array<{
    image_url: string;
    alt_text?: string;
    stock_quantity?: number;
    is_available?: boolean;
  }>;
  product_prices: Array<{
    price: number;
    product_sizes?: {
      name: string;
      dimensions: string;
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
export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(banner);

  // Hook para detectar tamanho da tela e trocar banner
  useEffect(() => {
    const updateBannerForScreen = () => {
      const width = window.innerWidth;
      
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
      // Buscar dados em paralelo
      const [productsResult, categoriesResult] = await Promise.all([supabase.from('products').select(`
            *,
            categories:category_id (name, icon),
            product_images (
              image_url,
              alt_text,
              stock_quantity,
              is_available
            ),
            product_prices (
              price,
              product_sizes (
                name,
                dimensions
              )
            )
          `).eq('status', 'active').order('created_at', {
        ascending: false
      }), supabase.from('categories').select('*').order('name')]);
      if (productsResult.error) throw productsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      // Processar produtos para incluir informações de dimensões
      const processedProducts = (productsResult.data || []).map(product => ({
        ...product,
        product_prices: product.product_prices.map(price => ({
          ...price,
          sizes: price.product_sizes ? {
            name: price.product_sizes.name,
            dimensions: price.product_sizes.dimensions
          } : undefined
        }))
      }));
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
  const generateWhatsAppLink = async (product: Product, size?: string) => {
    let variantCode = '';

    // Buscar código da variante específica
    if (size) {
      try {
        const {
          data: variant
        } = await supabase.from('product_variants').select('variant_code, product_sizes!inner(name)').eq('product_id', product.id).eq('product_sizes.name', size).single();
        if (variant) {
          variantCode = variant.variant_code;
        }
      } catch (error) {
        console.log('Variante não encontrada, usando código do produto');
        variantCode = product.id.substring(0, 8).toUpperCase();
      }
    }
    const sizeInfo = size ? `tamanho ${size}` : '';
    const productInfo = sizeInfo;
    const codeInfo = variantCode ? `\nCódigo: ${variantCode}` : '';
    const message = `Olá! Tenho interesse no produto: ${product.name}${productInfo ? ` (${productInfo})` : ''}${codeInfo}`;
    return `https://wa.me/5511937413939?text=${encodeURIComponent(message)}`;
  };
  const handleWhatsAppClick = async (product: Product, size?: string) => {
    const link = await generateWhatsAppLink(product, size);
    window.open(link, '_blank');
  };
  const getProductImage = (product: Product) => {
    return product.product_images[0]?.image_url || '/placeholder.svg';
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
      <Header />
      
      {/* Hero Section - Strip bem fino pra produtos aparecerem acima da dobra */}
      <section className="relative min-h-[120px] sm:min-h-[170px] lg:min-h-[210px] overflow-hidden" style={{
      backgroundImage: `url(${currentBanner})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
        {/* Gradient overlay pra legibilidade do texto sobre o pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-black/20 pointer-events-none" />

        {/* Conteúdo principal responsivo */}
        <div className="relative z-20 container min-h-[120px] sm:min-h-[170px] lg:min-h-[210px] flex items-center justify-center py-2 sm:py-3 lg:py-4 px-4">
          <div className="text-center space-y-1.5 sm:space-y-2 max-w-4xl mx-auto">

            {/* Título principal responsivo */}
            <div>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black mb-1 sm:mb-1.5 text-primary leading-tight px-2">
                Catálogo PelúciaPet
              </h1>

              {/* Linha decorativa */}
              <div className="w-8 sm:w-10 md:w-12 lg:w-16 h-0.5 bg-pet-gold mx-auto rounded-full"></div>
            </div>

            {/* Subtítulo - some no mobile pra economizar altura */}
            <p className="hidden sm:block text-xs sm:text-sm md:text-base text-primary mb-1.5 sm:mb-2 leading-snug px-2">
              Produtos de luxo para o <span className="text-primary font-bold">conforto supremo</span> do seu pet
            </p>

            {/* Botões responsivos - lado a lado em todas as larguras */}
            <div className="flex flex-row flex-wrap gap-2 sm:gap-2.5 justify-center items-center px-2">
              <Button
                onClick={() => window.open('https://wa.me/5511937413939', '_blank')}
                className="bg-pet-gold hover:bg-pet-gold/90 text-pet-brown-dark px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold h-7 sm:h-8"
              >
                <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                Fale Conosco
              </Button>

              <Button
                variant="outline"
                onClick={() => document.querySelector('.grid')?.scrollIntoView({
                  behavior: 'smooth'
                })}
                className="border-pet-brown-dark text-pet-brown-dark hover:bg-pet-brown-dark hover:text-white px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold h-7 sm:h-8"
              >
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                Ver Produtos
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-12">
        {/* Filtros de categoria */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Explore por categoria</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Encontre o produto perfeito pro seu pet</p>
            </div>
            
            {/* Menu hambúrguer para mobile */}
            <Sheet open={isCategoryMenuOpen} onOpenChange={setIsCategoryMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden rounded-full gap-2 border-pet-brown-dark/20 hover:border-pet-brown-dark hover:bg-pet-brown-dark hover:text-white">
                  <Menu className="h-4 w-4" />
                  Categorias
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold text-primary">Categorias</SheetTitle>
                  <SheetDescription>
                    Escolha uma categoria para filtrar os produtos
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => { setSelectedCategory('all'); setIsCategoryMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${selectedCategory === 'all'
                      ? 'bg-pet-brown-dark text-white shadow-md'
                      : 'hover:bg-muted'}`}
                  >
                    <span className="text-xl" aria-hidden>🏪</span>
                    <span className="font-medium">Todos os produtos</span>
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => { setSelectedCategory(category.name); setIsCategoryMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${selectedCategory === category.name
                        ? 'bg-pet-brown-dark text-white shadow-md'
                        : 'hover:bg-muted'}`}
                    >
                      <span className="text-xl" aria-hidden>{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Filtros em linha para desktop — pill chips */}
          <div className="hidden md:flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`group inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === 'all'
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
                className={`group inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === category.name
                  ? 'bg-pet-brown-dark text-white shadow-md scale-105'
                  : 'bg-card border border-border hover:border-pet-brown-dark hover:bg-pet-brown-dark hover:text-white'}`}
              >
                <span className="text-base" aria-hidden>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
          
          {/* Categoria selecionada para mobile — pill chip */}
          <div className="md:hidden mt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pet-brown-dark text-white shadow-md">
              <span aria-hidden>{selectedCategory === 'all' ? '🏪' : categories.find(c => c.name === selectedCategory)?.icon}</span>
              <span className="text-sm font-medium">{selectedCategory === 'all' ? 'Todos os produtos' : selectedCategory}</span>
            </div>
          </div>
        </div>

        {/* Grid de produtos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {filteredProducts.map(product => <ProductCard key={product.id} product={product} onWhatsApp={(size) => handleWhatsAppClick(product, size)} onViewDetails={setSelectedProduct} />)}
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

      {/* Modal de detalhes do produto */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary flex items-center justify-between">
                  {selectedProduct.name}
                  {selectedProduct.is_custom_order && <Badge className="bg-pet-gold text-white">
                      <Tag className="h-3 w-3 mr-1" />
                      Sob encomenda
                    </Badge>}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Galeria de imagens */}
                <div className="space-y-4">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img src={getProductImage(selectedProduct) || '/placeholder.svg'} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Informações do produto */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                    <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {selectedProduct.description}
                    </div>
                    {selectedProduct.observations && (
                      <p className="text-orange-600 mt-3 font-medium whitespace-pre-line">
                        {selectedProduct.observations}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Categoria</h3>
                    <Badge variant="outline" className="text-sm">
                      <span className="mr-1">{selectedProduct.categories?.icon}</span>
                      {selectedProduct.categories?.name}
                    </Badge>
                  </div>

                  {/* Tabela de preços detalhada */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Tamanhos e preços</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedProduct.product_prices.map(price => (
                        <div 
                          key={price.sizes?.name || 'no-size'} 
                          onClick={() => setSelectedSize(selectedSize === price.sizes?.name ? '' : price.sizes?.name || '')} 
                          className={`cursor-pointer rounded-xl p-4 border transition-all duration-300 hover:shadow-md ${
                            selectedSize === price.sizes?.name 
                              ? 'bg-orange-100 border-orange-300 shadow-md' 
                              : 'bg-gray-50 border-gray-200 hover:border-orange-200'
                          }`}
                        >
                          <div className="font-bold text-gray-800 text-lg">{price.sizes?.name}</div>
                          {price.sizes?.dimensions && (
                            <div className="text-xs text-gray-500 mb-2">{price.sizes.dimensions}</div>
                          )}
                          <div className="font-bold text-emerald-600 text-xl">R$ {price.price.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => handleWhatsAppClick(selectedProduct, selectedSize)} className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200" size="lg">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Pedir via WhatsApp
                    </Button>
                  </div>

                  {/* Cores disponíveis */}
                  {selectedProduct.product_images && selectedProduct.product_images.length > 1 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Eye className="w-5 h-5 mr-2" />
                        Cores disponíveis:
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {selectedProduct.product_images.map((image, index) => (
                          <div key={index} className="relative group">
                             <img
                               src={image.image_url}
                               alt={`${selectedProduct.name} - Cor ${index + 1}`}
                               className="w-20 h-20 rounded-xl object-cover cursor-pointer transition-all duration-300 border-[3px] border-solid border-gray-400 hover:border-orange-400"
                               style={{
                                 boxShadow: `
                                   0 6px 12px rgba(0, 0, 0, 0.15),
                                   inset 0 2px 4px rgba(255, 255, 255, 0.4),
                                   inset 0 -2px 4px rgba(0, 0, 0, 0.2),
                                   0 0 0 1px rgba(255, 255, 255, 0.2)
                                 `,
                                 transform: 'translateZ(0)'
                               }}
                               onMouseEnter={(e) => {
                                 e.currentTarget.style.boxShadow = `
                                   0 10px 20px rgba(0, 0, 0, 0.25),
                                   inset 0 3px 6px rgba(255, 255, 255, 0.5),
                                   inset 0 -3px 6px rgba(0, 0, 0, 0.3),
                                   0 0 0 2px rgba(255, 255, 255, 0.3)
                                 `;
                                 e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                               }}
                               onMouseLeave={(e) => {
                                 e.currentTarget.style.boxShadow = `
                                   0 6px 12px rgba(0, 0, 0, 0.15),
                                   inset 0 2px 4px rgba(255, 255, 255, 0.4),
                                   inset 0 -2px 4px rgba(0, 0, 0, 0.2),
                                   0 0 0 1px rgba(255, 255, 255, 0.2)
                                 `;
                                 e.currentTarget.style.transform = 'translateY(0) scale(1)';
                               }}
                             />
                            {/* Stock indicator */}
                            {image.stock_quantity && image.stock_quantity <= 2 && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>}
        </DialogContent>
      </Dialog>

      {/* Seção de Benefícios */}
      <section className="bg-pet-beige-light/30 py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground">Por que comprar com a gente</h2>
            <p className="text-sm text-muted-foreground mt-1">Benefícios pensados pro seu pet e pra você</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
              <h3 className="font-bold text-sm text-foreground mb-1">Frete</h3>
              <p className="text-xs text-muted-foreground">A combinar</p>
            </div>

            <div className="group bg-card rounded-2xl p-5 sm:p-6 text-center border border-border/50 hover:border-pet-gold/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-pet-gold/15 group-hover:bg-pet-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors duration-300">
                <svg className="h-6 w-6 text-pet-brown-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Parcelamento</h3>
              <p className="text-xs text-muted-foreground">Em até 12x</p>
            </div>

            <div className="group bg-card rounded-2xl p-5 sm:p-6 text-center border border-border/50 hover:border-pet-gold/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-pet-gold/15 group-hover:bg-pet-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors duration-300">
                <svg className="h-6 w-6 text-pet-brown-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Garantia</h3>
              <p className="text-xs text-muted-foreground">1 mês de cobertura</p>
            </div>

            <div className="group bg-card rounded-2xl p-5 sm:p-6 text-center border border-border/50 hover:border-pet-gold/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-pet-gold/15 group-hover:bg-pet-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors duration-300">
                <svg className="h-6 w-6 text-pet-brown-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">Troca Fácil</h3>
              <p className="text-xs text-muted-foreground">7 dias para devolução</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
}
interface ProductCardProps {
  product: Product;
  onWhatsApp: (size?: string) => void;
  onViewDetails: (product: Product) => void;
}
function ProductCard({
  product,
  onWhatsApp,
  onViewDetails
}: ProductCardProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isLiked, setIsLiked] = useState(false);

  // Filtrar apenas imagens disponíveis
  const availableImages = product.product_images.filter(img => img.is_available !== false);
  const currentImage = availableImages[selectedImageIndex]?.image_url || availableImages[0]?.image_url;
  const prices = product.product_prices.map(p => p.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const hasPriceRange = minPrice !== maxPrice;

  return (
    <div
      onClick={() => onViewDetails(product)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewDetails(product); } }}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${product.name}`}
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

        {/* Like button (top-right) */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
          aria-label={isLiked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-md ring-1 ring-black/5 hover:bg-card hover:scale-110 transition-all duration-200"
        >
          <Heart
            className={`h-4 w-4 transition-all duration-200 ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-muted-foreground'}`}
          />
        </button>

        {/* Custom order badge (bottom-left) */}
        {product.is_custom_order && (
          <div className="absolute bottom-2 left-2 bg-pet-gold/95 text-pet-brown-dark text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-md ring-1 ring-black/5 flex items-center gap-1">
            <Tag className="h-2.5 w-2.5" />
            Sob encomenda
          </div>
        )}

        {/* Color swatches overlay (bottom-right) */}
        {availableImages.length > 1 && (
          <div className="absolute bottom-2 right-2 flex gap-1 bg-card/80 backdrop-blur-sm rounded-full px-1.5 py-1 shadow-md ring-1 ring-black/5">
            {availableImages.slice(0, 4).map((image, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                aria-label={`Selecionar cor ${idx + 1}`}
                className={`w-4 h-4 rounded-full overflow-hidden transition-all duration-200 ${selectedImageIndex === idx
                  ? 'ring-2 ring-pet-gold ring-offset-1 scale-110'
                  : 'ring-1 ring-black/10 hover:scale-110'}`}
              >
                <img src={image.image_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
            {availableImages.length > 4 && (
              <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[8px] font-bold">
                +{availableImages.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="p-3 space-y-1">
        {/* Title + category */}
        <div>
          <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-pet-brown-dark transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Observations */}
        {product.observations && (
          <p className="text-orange-600 text-[11px] font-medium line-clamp-1 italic">
            {product.observations}
          </p>
        )}

        {/* Price */}
        <div className="pt-1">
          {hasPriceRange ? (
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">A partir de</div>
              <div className="text-lg font-bold text-emerald-600 leading-none">
                R$ {minPrice.toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="text-lg font-bold text-emerald-600 leading-none">
              R$ {minPrice.toFixed(2)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5 pt-1">
          <Button
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onViewDetails(product); }}
            className="flex-1 h-9 text-xs font-semibold border-border hover:border-pet-brown-dark hover:bg-pet-brown-dark hover:text-white rounded-xl transition-all duration-200"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Detalhes
          </Button>
          <Button
            onClick={(e) => { e.stopPropagation(); onWhatsApp(); }}
            className="flex-1 h-9 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1" />
            Pedir
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