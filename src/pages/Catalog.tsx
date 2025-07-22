import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MessageCircle, Eye, Palette, Tag, X, Heart, Menu } from 'lucide-react';
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
    return `https://wa.me/5511914608191?text=${encodeURIComponent(message)}`;
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
        <div className="container py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pet-gold mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando catálogo...</p>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-warm font-quicksand">
      <Header />

      <div className="container mx-auto px-4 py-12">
        {/* Título da seção */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 font-poppins">
            Categorias
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra nossa coleção exclusiva de produtos premium para seu melhor amigo
          </p>
        </div>

        {/* Filtros de categoria - Design luxuoso */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-semibold text-foreground font-poppins">Escolha uma categoria</h2>
            
            {/* Menu hambúrguer para mobile */}
            <Sheet open={isCategoryMenuOpen} onOpenChange={setIsCategoryMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="premium" size="sm" className="md:hidden flex items-center gap-2">
                  <Menu className="h-4 w-4" />
                  Categorias
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-gradient-card">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold text-foreground font-poppins">Categorias</SheetTitle>
                  <SheetDescription className="text-muted-foreground">
                    Escolha uma categoria para filtrar os produtos
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-8 space-y-3">
                  <Button 
                    variant={selectedCategory === 'all' ? 'success' : 'ghost'} 
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsCategoryMenuOpen(false);
                    }} 
                    className="w-full justify-start text-left h-auto p-5 transition-all duration-300 rounded-2xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-pet-success/10 rounded-xl flex items-center justify-center text-lg">
                        🏪
                      </div>
                      <span className="font-semibold">Todos os produtos</span>
                    </div>
                  </Button>
                  {categories.map(category => 
                    <Button 
                      key={category.id} 
                      variant={selectedCategory === category.name ? 'success' : 'ghost'} 
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setIsCategoryMenuOpen(false);
                      }} 
                      className="w-full justify-start text-left h-auto p-5 transition-all duration-300 rounded-2xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-pet-success/10 rounded-xl flex items-center justify-center text-lg">
                          {category.icon}
                        </div>
                        <span className="font-semibold">{category.name}</span>
                      </div>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Filtros em linha para desktop - Design luxuoso */}
          <div className="hidden md:flex flex-wrap gap-4 justify-center">
            <Button 
              variant={selectedCategory === 'all' ? 'success' : 'premium'} 
              onClick={() => setSelectedCategory('all')} 
              className="transition-all duration-300 text-base px-8 py-4 h-16 rounded-2xl"
              size="lg"
            >
              <span className="text-xl mr-3">🏪</span>
              <span>Todos os produtos</span>
            </Button>
            {categories.map(category => 
              <Button 
                key={category.id} 
                variant={selectedCategory === category.name ? 'success' : 'premium'} 
                onClick={() => setSelectedCategory(category.name)} 
                className="transition-all duration-300 text-base px-8 py-4 h-16 rounded-2xl"
                size="lg"
              >
                <span className="text-xl mr-3">{category.icon}</span>
                <span>{category.name}</span>
              </Button>
            )}
          </div>
          
          {/* Categoria selecionada para mobile */}
          <div className="md:hidden mt-6">
            <div className="bg-gradient-card rounded-2xl p-4 shadow-card border border-pet-neutral/20">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Categoria selecionada:</p>
              <div className="flex items-center gap-3">
                {selectedCategory === 'all' ? (
                  <>
                    <span className="text-lg">🏪</span>
                    <span className="font-semibold text-foreground">Todos os produtos</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">{categories.find(c => c.name === selectedCategory)?.icon}</span>
                    <span className="font-semibold text-foreground">{selectedCategory}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grid de produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => <ProductCard key={product.id} product={product} onWhatsApp={(size) => handleWhatsAppClick(product, size)} onViewDetails={setSelectedProduct} />)}
        </div>

        {filteredProducts.length === 0 && <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              Nenhum produto encontrado nesta categoria.
            </p>
          </div>}
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
                    <p className="text-muted-foreground">
                      {selectedProduct.description}
                    </p>
                    {selectedProduct.observations && <p className="text-pet-gold mt-2 font-medium">
                        {selectedProduct.observations}
                      </p>}
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
                    <div className="space-y-2">
                      {selectedProduct.product_prices.map(price => <div key={price.sizes?.name || 'no-size'} onClick={() => setSelectedSize(selectedSize === price.sizes?.name ? '' : price.sizes?.name || '')} className={`cursor-pointer border rounded-lg p-3 transition-all duration-200 ${selectedSize === price.sizes?.name ? 'bg-pet-brown-medium text-white border-pet-brown-medium' : 'bg-background border-border hover:border-pet-gold'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-lg">{price.sizes?.name}</span>
                              {price.sizes?.dimensions && <p className="text-sm opacity-75">
                                  {price.sizes.dimensions}
                                </p>}
                            </div>
                            <span className="font-bold text-xl">
                              R$ {price.price.toFixed(2)}
                            </span>
                          </div>
                        </div>)}
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => handleWhatsAppClick(selectedProduct, selectedSize)} className="flex-1 bg-green-500 hover:bg-green-600 text-white transition-all duration-300" size="lg">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Pedir via WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </>}
        </DialogContent>
      </Dialog>

      {/* Seção de Benefícios */}
      <section className="bg-background py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card rounded-2xl p-6 text-center shadow-lg border-2 border-pet-beige-medium hover:border-pet-gold hover:shadow-2xl hover:bg-pet-beige-light hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-pet-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-pet-gold/30">
                <MessageCircle className="h-6 w-6 text-pet-gold" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Frete</h3>
              <p className="text-sm text-muted-foreground">À combinar</p>
            </div>

            <div className="bg-card rounded-2xl p-6 text-center shadow-lg border-2 border-pet-beige-medium hover:border-pet-gold hover:shadow-2xl hover:bg-pet-beige-light hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-pet-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-pet-gold/30">
                <Tag className="h-6 w-6 text-pet-gold" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Parcelamento</h3>
              <p className="text-sm text-muted-foreground">Com juros</p>
            </div>

            <div className="bg-card rounded-2xl p-6 text-center shadow-lg border-2 border-pet-beige-medium hover:border-pet-gold hover:shadow-2xl hover:bg-pet-beige-light hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-pet-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-pet-gold/30">
                <Heart className="h-6 w-6 text-pet-gold" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Garantia de Qualidade</h3>
              <p className="text-sm text-muted-foreground">1 meses de garantia</p>
            </div>

            <div className="bg-card rounded-2xl p-6 text-center shadow-lg border-2 border-pet-beige-medium hover:border-pet-gold hover:shadow-2xl hover:bg-pet-beige-light hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-pet-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-pet-gold/30">
                <X className="h-6 w-6 text-pet-gold" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Troca Fácil</h3>
              <p className="text-sm text-muted-foreground">7 dias para devolução</p>
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
  const [selectedSize, setSelectedSize] = useState<string>('');
  
  // Filtrar apenas imagens disponíveis
  const availableImages = product.product_images.filter(img => img.is_available !== false);
  const currentImage = availableImages[selectedImageIndex]?.image_url || availableImages[0]?.image_url;
  const selectedPrice = selectedSize ? product.product_prices.find(p => p.sizes?.name === selectedSize)?.price : null;
  return <div className="group">
      <Card className="
        relative overflow-hidden h-full
        bg-gradient-card shadow-card hover:shadow-hover
        border border-pet-neutral/20 rounded-3xl
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:-translate-y-1
        font-quicksand
      ">
        
        <CardHeader className="p-0 relative">
          <div className="relative aspect-square overflow-hidden rounded-t-3xl">
            <img 
              src={currentImage || '/placeholder.svg'} 
              alt={product.name} 
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" 
            />
            
            {/* Overlay suave */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500" />
            
            {/* Badge de encomenda */}
            {product.is_custom_order && 
              <Badge className="
                absolute top-4 right-4 
                bg-pet-warm-orange text-white shadow-md
                rounded-full px-3 py-1
                font-medium text-xs
              ">
                <Tag className="h-3 w-3 mr-1" />
                Sob encomenda
              </Badge>
            }
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          {/* Título e descrição */}
          <div>
            <h3 className="font-poppins font-bold text-xl text-foreground mb-2 leading-tight">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {product.description}
            </p>
            {product.observations && 
              <p className="text-xs text-pet-warm-orange mt-2 font-medium">
                {product.observations}
              </p>
            }
          </div>

          {/* Seção de tamanhos e preços */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground font-poppins">
              Tamanhos e preços
            </Label>
            <div className="space-y-2">
              {product.product_prices.map((price, index) => 
                <div 
                  key={price.sizes?.name || `price-${index}`} 
                  onClick={() => setSelectedSize(selectedSize === price.sizes?.name ? '' : price.sizes?.name || '')} 
                  className={`
                    cursor-pointer p-4 rounded-xl transition-all duration-300
                    ${selectedSize === price.sizes?.name 
                      ? 'bg-pet-success text-white shadow-md ring-2 ring-pet-success/30' 
                      : 'bg-card hover:bg-secondary border border-pet-neutral/30 hover:border-pet-success/50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm">{price.sizes?.name}</span>
                      {price.sizes?.dimensions && 
                        <p className="text-xs opacity-75 mt-1">
                          {price.sizes.dimensions}
                        </p>
                      }
                    </div>
                    <span className="font-bold text-lg">
                      R$ {price.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="secondary" 
              onClick={() => onViewDetails(product)} 
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
            <Button 
              variant="success" 
              onClick={() => onWhatsApp(selectedSize)} 
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Pedir Agora
            </Button>
          </div>

          {/* Miniaturas das imagens disponíveis */}
          {availableImages.length > 1 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center text-pet-brown-dark">
                <Eye className="h-3 w-3 mr-2" />
                Cores disponíveis:
              </Label>
              <div className="flex flex-wrap gap-2">
                {availableImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`
                      relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300
                      ${selectedImageIndex === index 
                        ? 'border-pet-brown-dark scale-105 shadow-lg' 
                        : 'border-gray-200 hover:border-pet-gold'}
                    `}
                  >
                    <img
                      src={image.image_url}
                      alt={`${product.name} - Imagem ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    {/* Indicador de estoque baixo */}
                    {image.stock_quantity && image.stock_quantity <= 2 && (
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        {/* Bottom glow effect */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-pet-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Card>
    </div>;
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