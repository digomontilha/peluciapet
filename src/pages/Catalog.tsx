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
  return <div className="min-h-screen bg-gradient-soft">
      <Header />
      
      {/* Hero Section - Responsivo */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] overflow-hidden" style={{
      backgroundImage: `url(${currentBanner})`,
      backgroundSize: 'cover',
      backgroundPosition: 'left center',
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
        {/* Conteúdo principal responsivo */}
        <div className="relative z-20 container min-h-[60vh] sm:min-h-[70vh] flex items-center justify-center py-8 px-4">
          <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
            
            {/* Título principal responsivo - texto menor para mobile */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-black mb-4 sm:mb-6 text-primary leading-tight px-2">
                Catálogo PelúciaPet
              </h1>
              
              {/* Linha decorativa */}
              <div className="w-16 sm:w-20 md:w-24 lg:w-32 h-1 bg-pet-gold mx-auto rounded-full"></div>
            </div>

            {/* Subtítulo responsivo */}
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-primary mb-6 sm:mb-8 leading-relaxed px-2">
              Produtos de luxo para o <span className="text-primary font-bold">conforto supremo</span> do seu pet
            </p>

            {/* Botões responsivos */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
              <Button 
                size="lg" 
                onClick={() => window.open('https://wa.me/5511914608191', '_blank')} 
                className="w-full sm:w-auto bg-pet-gold hover:bg-pet-gold/90 text-pet-brown-dark px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold min-h-[48px]"
              >
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                Fale Conosco Agora
              </Button>

              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => document.querySelector('.grid')?.scrollIntoView({
                  behavior: 'smooth'
                })} 
                className="w-full sm:w-auto border-pet-brown-dark text-pet-brown-dark hover:bg-pet-brown-dark hover:text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold min-h-[48px]"
              >
                <Eye className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
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
            <h2 className="text-2xl font-bold text-primary">Categorias</h2>
            
            {/* Menu hambúrguer para mobile */}
            <Sheet open={isCategoryMenuOpen} onOpenChange={setIsCategoryMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden flex items-center gap-2">
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
                <div className="mt-6 space-y-3">
                  <Button variant={selectedCategory === 'all' ? 'default' : 'ghost'} onClick={() => {
                  setSelectedCategory('all');
                  setIsCategoryMenuOpen(false);
                }} className="w-full justify-start text-left h-auto p-4 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        🏪
                      </div>
                      <span className="font-medium">Todos os produtos</span>
                    </div>
                  </Button>
                  {categories.map(category => <Button key={category.id} variant={selectedCategory === category.name ? 'default' : 'ghost'} onClick={() => {
                  setSelectedCategory(category.name);
                  setIsCategoryMenuOpen(false);
                }} className="w-full justify-start text-left h-auto p-4 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          {category.icon}
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </Button>)}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Filtros em linha para desktop */}
          <div className="hidden md:flex flex-wrap gap-3">
            <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} onClick={() => setSelectedCategory('all')} className="transition-all duration-300 hover-scale">
              🏪 Todos os produtos
            </Button>
            {categories.map(category => <Button key={category.id} variant={selectedCategory === category.name ? 'default' : 'outline'} onClick={() => setSelectedCategory(category.name)} className="transition-all duration-300 hover-scale">
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>)}
          </div>
          
          {/* Categoria selecionada para mobile */}
          <div className="md:hidden mt-4">
            <div className="bg-card rounded-lg p-3 border">
              <p className="text-sm text-muted-foreground mb-1">Categoria selecionada:</p>
              <div className="flex items-center gap-2">
                {selectedCategory === 'all' ? <>
                    <span>🏪</span>
                    <span className="font-medium">Todos os produtos</span>
                  </> : <>
                    <span>{categories.find(c => c.name === selectedCategory)?.icon}</span>
                    <span className="font-medium">{selectedCategory}</span>
                  </>}
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
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 group">
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-orange-50 to-peach-50">
        <img 
          src={currentImage || '/placeholder.svg'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Custom Order Badge */}
        {product.is_custom_order && (
          <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
            <Tag className="h-3 w-3 mr-1" />
            Sob encomenda
          </Badge>
        )}
      </div>

      {/* Product Content */}
      <div className="p-6">
        {/* Product Title */}
        <h3 className="font-bold text-xl mb-3 text-gray-800">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">{product.description}</p>
        
        {/* Observations */}
        {product.observations && (
          <p className="text-orange-600 text-sm mb-4 font-medium">{product.observations}</p>
        )}
        
        {/* Sizes and Prices */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-gray-700 text-sm uppercase tracking-wide">Tamanhos e preços:</h4>
          <div className="grid grid-cols-2 gap-2">
            {product.product_prices.map((price, index) => (
              <div 
                key={price.sizes?.name || `price-${index}`} 
                onClick={() => setSelectedSize(selectedSize === price.sizes?.name ? '' : price.sizes?.name || '')}
                className={`
                  cursor-pointer rounded-lg p-3 border transition-all duration-300 hover:shadow-sm
                  ${selectedSize === price.sizes?.name 
                    ? 'bg-orange-100 border-orange-300' 
                    : 'bg-gray-50 border-gray-200 hover:border-orange-200'}
                `}
              >
                <div className="font-bold text-gray-800 text-base">{price.sizes?.name}</div>
                <div className="text-xs text-gray-500 mb-1">{price.sizes?.dimensions}</div>
                <div className="font-bold text-emerald-600 text-base">R$ {price.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button 
            variant="outline" 
            onClick={() => onViewDetails(product)} 
            className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-xl h-12"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalhes
          </Button>
          <Button 
            onClick={() => onWhatsApp(selectedSize)} 
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Pedir Agora
          </Button>
        </div>
        
        {/* Available Images */}
        {availableImages.length > 1 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center text-gray-700 text-sm uppercase tracking-wide">
              <Eye className="w-4 h-4 mr-2" />
              Cores disponíveis:
            </h4>
            <div className="flex flex-wrap gap-3">
              {availableImages.map((image, index) => (
                <div key={index} className="relative group">
                  <button
                    onClick={() => setSelectedImageIndex(index)}
                    className={`
                      w-16 h-16 rounded-xl border-3 object-cover cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md
                      ${selectedImageIndex === index 
                        ? 'border-orange-300 scale-105' 
                        : 'border-gray-200 hover:border-orange-200'}
                    `}
                  >
                    <img
                      src={image.image_url}
                      alt={`${product.name} - Cor ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </button>
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