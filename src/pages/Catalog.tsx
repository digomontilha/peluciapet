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
import banner from '@/assets/pelucia-pet-banner.png';

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
    color_id?: string;
    colors?: {
      name: string;
      hex_code: string;
    };
  }>;
  product_prices: Array<{
    size: string;
    price: number;
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

interface Color {
  id: string;
  name: string;
  hex_code: string;
}

interface Size {
  id: string;
  name: string;
  dimensions: string;
}

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar dados em paralelo
      const [productsResult, categoriesResult, colorsResult, sizesResult] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            categories:category_id (name, icon),
            product_images (
              image_url,
              alt_text,
              color_id,
              colors:color_id (name, hex_code)
            ),
            product_prices (size, price)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        
        supabase
          .from('categories')
          .select('*')
          .order('name'),
          
        supabase
          .from('colors')
          .select('*')
          .order('name'),
          
        supabase
          .from('sizes')
          .select('*')
          .order('display_order')
      ]);

      if (productsResult.error) throw productsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (colorsResult.error) throw colorsResult.error;
      if (sizesResult.error) throw sizesResult.error;

      // Processar produtos para incluir informações de dimensões
      const processedProducts = (productsResult.data || []).map(product => ({
        ...product,
        product_prices: product.product_prices.map(price => {
          const sizeInfo = sizesResult.data?.find(size => size.name === price.size);
          return {
            ...price,
            sizes: sizeInfo ? {
              name: sizeInfo.name,
              dimensions: sizeInfo.dimensions
            } : undefined
          };
        })
      }));

      setProducts(processedProducts);
      setCategories(categoriesResult.data || []);
      setColors(colorsResult.data || []);
      setSizes(sizesResult.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar o catálogo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    selectedCategory === 'all' || product.categories?.name === selectedCategory
  );

  const generateWhatsAppLink = async (product: Product, size?: string, color?: string) => {
    let variantCode = '';
    
    // Buscar código da variante específica
    if (size) {
      try {
        const { data: variant } = await supabase
          .from('product_variants')
          .select('variant_code')
          .eq('product_id', product.id)
          .eq('size', size)
          .eq('color_id', color || null)
          .single();
        
        if (variant) {
          variantCode = variant.variant_code;
        }
      } catch (error) {
        console.log('Variante não encontrada, usando código do produto');
        variantCode = product.id.substring(0, 8).toUpperCase();
      }
    }
    
    const colorName = color ? colors.find(c => c.id === color)?.name : '';
    const sizeInfo = size ? `tamanho ${size}` : '';
    const colorInfo = colorName ? `cor ${colorName}` : '';
    const productInfo = [sizeInfo, colorInfo].filter(Boolean).join(', ');
    const codeInfo = variantCode ? `\nCódigo: ${variantCode}` : '';
    
    const message = `Olá! Tenho interesse no produto: ${product.name}${productInfo ? ` (${productInfo})` : ''}${codeInfo}`;
    return `https://wa.me/5511914608191?text=${encodeURIComponent(message)}`;
  };

  const handleWhatsAppClick = async (product: Product, size?: string, color?: string) => {
    const link = await generateWhatsAppLink(product, size, color);
    window.open(link, '_blank');
  };

  const getProductImage = (product: Product, colorId?: string) => {
    if (!colorId) {
      return product.product_images[0]?.image_url || '/placeholder.svg';
    }
    
    const colorImage = product.product_images.find(img => img.color_id === colorId);
    return colorImage?.image_url || product.product_images[0]?.image_url || '/placeholder.svg';
  };

  const getAvailableColors = (product: Product) => {
    const colorIds = product.product_images
      .map(img => img.color_id)
      .filter(Boolean) as string[];
    
    return colors.filter(color => colorIds.includes(color.id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Header />
        <div className="container py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pet-gold mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando catálogo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      
      {/* Hero Section - ESPETACULAR */}
      <section 
        className="relative min-h-[70vh] overflow-hidden"
        style={{
          backgroundImage: `url(${banner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-pet-brown-dark/40 via-transparent to-pet-brown-medium/30"></div>
        
        {/* Partículas flutuantes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Efeito de brilho em movimento */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[slide-shine_8s_ease-in-out_infinite]"></div>

        {/* Conteúdo principal com efeitos 3D */}
        <div className="relative z-20 container min-h-[70vh] flex items-center justify-center">
          <div className="text-center space-y-8 transform perspective-1000">
            
            {/* Título principal com efeito 3D impressionante */}
            <div className="relative">
              <h1 className="text-5xl md:text-8xl font-black mb-6 relative">
                {/* Texto principal com gradiente animado */}
                <span className="relative bg-gradient-to-r from-white via-pet-gold to-white bg-clip-text text-transparent animate-glow-pulse text-shadow-warm">
                  Catálogo PelúciaPet
                </span>
                {/* Brilho superior */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent bg-clip-text text-transparent opacity-0 animate-[glow-pulse_3s_ease-in-out_infinite]">
                  Catálogo PelúciaPet
                </span>
              </h1>
              
              {/* Linha decorativa animada */}
              <div className="w-32 h-1 bg-gradient-to-r from-pet-gold to-yellow-400 mx-auto rounded-full animate-pulse transform hover:scale-110 transition-transform duration-300"></div>
            </div>

            {/* Subtítulo elegante */}
            <p className="text-xl md:text-3xl text-white/95 mb-8 drop-shadow-lg leading-relaxed max-w-4xl mx-auto animate-fade-in">
              <span className="relative">
                Produtos de luxo para o 
                <span className="text-pet-gold font-bold animate-glow-pulse"> conforto supremo </span>
                do seu pet
              </span>
            </p>

            {/* Botões com efeitos incríveis */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                onClick={() => window.open('https://wa.me/5511914608191', '_blank')}
                className="
                  relative group px-8 py-4 text-lg font-bold
                  bg-gradient-to-r from-pet-gold via-yellow-400 to-pet-gold 
                  hover:from-yellow-400 hover:via-pet-gold hover:to-yellow-400
                  text-white shadow-2xl hover:shadow-3xl
                  transform transition-all duration-500 ease-out
                  hover:scale-110 hover:-translate-y-2
                  border-2 border-white/30
                  backdrop-blur-sm
                  before:absolute before:inset-0 before:bg-white/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                  overflow-hidden
                "
              >
                {/* Efeito de brilho no botão */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="relative flex items-center gap-3">
                  <MessageCircle className="h-6 w-6 animate-bounce" />
                  <span>Fale Conosco Agora</span>
                </div>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => document.querySelector('.grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="
                  px-8 py-4 text-lg font-bold
                  bg-white/10 hover:bg-white/20
                  border-2 border-white/50 hover:border-white
                  text-white backdrop-blur-md
                  transform transition-all duration-500 ease-out
                  hover:scale-105 hover:-translate-y-1
                  shadow-lg hover:shadow-2xl
                  group
                "
              >
                <div className="flex items-center gap-3">
                  <Eye className="h-6 w-6 group-hover:animate-pulse" />
                  <span>Ver Produtos</span>
                </div>
              </Button>
            </div>

            {/* Indicador de scroll animado */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Efeitos de canto com gradientes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-pet-gold/30 to-transparent rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-radial from-white/20 to-transparent rounded-full filter blur-3xl animate-float"></div>
        
        {/* Onda decorativa na parte inferior */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-20 fill-current text-background" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="animate-[wave_6s_ease-in-out_infinite]"></path>
          </svg>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden flex items-center gap-2"
                >
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
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsCategoryMenuOpen(false);
                    }}
                    className="w-full justify-start text-left h-auto p-4 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        🏪
                      </div>
                      <span className="font-medium">Todos os produtos</span>
                    </div>
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.name ? 'default' : 'ghost'}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setIsCategoryMenuOpen(false);
                      }}
                      className="w-full justify-start text-left h-auto p-4 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          {category.icon}
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Filtros em linha para desktop */}
          <div className="hidden md:flex flex-wrap gap-3">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className="transition-all duration-300 hover-scale"
            >
              🏪 Todos os produtos
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.name ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.name)}
                className="transition-all duration-300 hover-scale"
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
          
          {/* Categoria selecionada para mobile */}
          <div className="md:hidden mt-4">
            <div className="bg-card rounded-lg p-3 border">
              <p className="text-sm text-muted-foreground mb-1">Categoria selecionada:</p>
              <div className="flex items-center gap-2">
                {selectedCategory === 'all' ? (
                  <>
                    <span>🏪</span>
                    <span className="font-medium">Todos os produtos</span>
                  </>
                ) : (
                  <>
                    <span>{categories.find(c => c.name === selectedCategory)?.icon}</span>
                    <span className="font-medium">{selectedCategory}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grid de produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              colors={colors}
              onWhatsApp={(size, color) => 
                handleWhatsAppClick(product, size, color)
              }
              onViewDetails={setSelectedProduct}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              Nenhum produto encontrado nesta categoria.
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalhes do produto */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary flex items-center justify-between">
                  {selectedProduct.name}
                  {selectedProduct.is_custom_order && (
                    <Badge className="bg-pet-gold text-white">
                      <Tag className="h-3 w-3 mr-1" />
                      Sob encomenda
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Galeria de imagens */}
                <div className="space-y-4">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={getProductImage(selectedProduct, selectedColor) || '/placeholder.svg'}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Cores disponíveis */}
                  {getAvailableColors(selectedProduct).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center">
                        <Palette className="h-3 w-3 mr-1" />
                        Cores disponíveis:
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {getAvailableColors(selectedProduct).map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setSelectedColor(selectedColor === color.id ? '' : color.id)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              selectedColor === color.id 
                                ? 'border-pet-brown-dark scale-110' 
                                : 'border-gray-300 hover:border-pet-gold'
                            }`}
                            style={{ backgroundColor: color.hex_code }}
                            title={color.name}
                          />
                        ))}
                      </div>
                      {selectedColor && (
                        <p className="text-sm text-muted-foreground">
                          Cor selecionada: {colors.find(c => c.id === selectedColor)?.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Informações do produto */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                    <p className="text-muted-foreground">
                      {selectedProduct.description}
                    </p>
                    {selectedProduct.observations && (
                      <p className="text-pet-gold mt-2 font-medium">
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
                    <div className="space-y-2">
                      {selectedProduct.product_prices.map((price) => (
                        <div
                          key={price.size}
                          onClick={() => setSelectedSize(selectedSize === price.size ? '' : price.size)}
                          className={`cursor-pointer border rounded-lg p-3 transition-all duration-200 ${
                            selectedSize === price.size 
                              ? 'bg-pet-gold text-white border-pet-gold' 
                              : 'bg-background border-border hover:border-pet-gold'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-lg">{price.size}</span>
                              {price.sizes?.dimensions && (
                                <p className="text-sm opacity-75">
                                  {price.sizes.dimensions}
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-xl">
                              R$ {price.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleWhatsAppClick(selectedProduct, selectedSize, selectedColor)}
                      className="flex-1 bg-gradient-warm hover:bg-gradient-elegant transition-all duration-300"
                      size="lg"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Pedir via WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Seção de Benefícios */}
      <section className="bg-background py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card rounded-2xl p-6 text-center shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-pet-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-pet-gold" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Frete</h3>
              <p className="text-sm text-muted-foreground">À combinar</p>
            </div>

            <div className="bg-card rounded-2xl p-6 text-center shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-pet-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="h-6 w-6 text-pet-gold" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Parcelamento</h3>
              <p className="text-sm text-muted-foreground">Com juros</p>
            </div>

            <div className="bg-card rounded-2xl p-6 text-center shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-pet-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-pet-gold" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Garantia de Qualidade</h3>
              <p className="text-sm text-muted-foreground">1 meses de garantia</p>
            </div>

            <div className="bg-card rounded-2xl p-6 text-center shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-pet-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-6 w-6 text-pet-gold" />
              </div>
              <h3 className="font-bold text-foreground mb-2">Troca Fácil</h3>
              <p className="text-sm text-muted-foreground">7 dias para devolução</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  colors: Color[];
  onWhatsApp: (size?: string, color?: string) => void;
  onViewDetails: (product: Product) => void;
}

function ProductCard({ product, colors, onWhatsApp, onViewDetails }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');

  const availableColors = product.product_images
    .map(img => img.color_id)
    .filter(Boolean) as string[];

  const productColors = colors.filter(color => availableColors.includes(color.id));
  const currentImage = selectedColor 
    ? product.product_images.find(img => img.color_id === selectedColor)?.image_url
    : product.product_images[0]?.image_url;

  const selectedPrice = selectedSize 
    ? product.product_prices.find(p => p.size === selectedSize)?.price
    : null;

  return (
    <div className="group perspective-1000">
      <Card className="
        relative overflow-hidden
        bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-xl
        border border-white/20 shadow-2xl
        transform-gpu transition-all duration-500 ease-out
        hover:scale-[1.02] hover:-translate-y-2
        hover:rotate-x-2 hover:rotate-y-1
        hover:shadow-3xl hover:shadow-pet-gold/20
        before:absolute before:inset-0 before:bg-gradient-to-br before:from-pet-gold/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
      ">
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
        
        <CardHeader className="p-0 relative">
          <div className="relative aspect-square overflow-hidden">
            {/* 3D Image container */}
            <div className="
              w-full h-full transform-gpu transition-all duration-700 ease-out
              group-hover:scale-110 group-hover:rotate-1
            ">
              <img
                src={currentImage || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover filter group-hover:brightness-110 transition-all duration-500"
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out opacity-0 group-hover:opacity-100" />
            </div>
            
            {/* Floating badge */}
            {product.is_custom_order && (
              <Badge className="
                absolute top-3 right-3 
                bg-gradient-to-r from-pet-gold to-yellow-500 
                text-white shadow-lg backdrop-blur-sm
                transform transition-all duration-300
                group-hover:scale-110 group-hover:-translate-y-1
                border border-white/30
              ">
                <Tag className="h-3 w-3 mr-1" />
                Sob encomenda
              </Badge>
            )}
            
            {/* Price preview floating */}
            {selectedSize && selectedPrice && (
              <div className="
                absolute bottom-3 left-3
                bg-white/90 backdrop-blur-md rounded-full px-3 py-1
                shadow-lg border border-white/30
                transform transition-all duration-300
                translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100
              ">
                <span className="text-sm font-bold text-pet-brown-dark">
                  R$ {selectedPrice.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-5 space-y-4 relative z-20">
          {/* Title with 3D effect */}
          <div className="transform transition-all duration-300 group-hover:translate-y-[-2px]">
            <h3 className="font-bold text-lg text-primary mb-2 leading-tight">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {product.description}
            </p>
            {product.observations && (
              <p className="text-xs text-pet-gold mt-2 font-medium">{product.observations}</p>
            )}
          </div>

          {/* Color selector with enhanced 3D effects */}
          {productColors.length > 0 && (
            <div className="space-y-3 transform transition-all duration-300 group-hover:translate-y-[-1px]">
              <Label className="text-sm font-medium flex items-center text-pet-brown-dark">
                <Palette className="h-3 w-3 mr-2" />
                Cores disponíveis:
              </Label>
              <div className="flex flex-wrap gap-2">
                {productColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(selectedColor === color.id ? '' : color.id)}
                    className={`
                      w-8 h-8 rounded-full border-2 transition-all duration-300 ease-out
                      transform hover:scale-125 hover:-translate-y-1
                      shadow-md hover:shadow-xl
                      ${selectedColor === color.id 
                        ? 'border-pet-brown-dark scale-110 shadow-lg ring-2 ring-pet-gold/30' 
                        : 'border-white hover:border-pet-gold shadow-sm'
                      }
                    `}
                    style={{ backgroundColor: color.hex_code }}
                    title={color.name}
                  />
                ))}
              </div>
              {selectedColor && (
                <p className="text-xs text-muted-foreground animate-fade-in">
                  Cor selecionada: {productColors.find(c => c.id === selectedColor)?.name}
                </p>
              )}
            </div>
          )}

          {/* Modern price grid */}
          <div className="space-y-3 transform transition-all duration-300 group-hover:translate-y-[-1px]">
            <Label className="text-sm font-medium text-pet-brown-dark">Tamanhos e preços:</Label>
            <div className="grid grid-cols-2 gap-2">
              {product.product_prices.map((price, index) => (
                <div
                  key={price.size}
                  onClick={() => setSelectedSize(selectedSize === price.size ? '' : price.size)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`
                    cursor-pointer border rounded-lg text-xs p-3 transition-all duration-300 ease-out
                    transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg
                    backdrop-blur-sm
                    ${selectedSize === price.size 
                      ? 'bg-gradient-to-r from-pet-gold to-yellow-500 text-white border-pet-gold shadow-lg ring-2 ring-pet-gold/30' 
                      : 'bg-white/80 border-gray-200 hover:border-pet-gold hover:bg-white/90 shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center justify-between leading-tight">
                    <span className="font-semibold">{price.size}</span>
                    <span className="font-bold">R$ {price.price.toFixed(2)}</span>
                  </div>
                  {price.sizes?.dimensions && (
                    <div className="text-xs opacity-75 leading-tight mt-1">
                      {price.sizes.dimensions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced action buttons */}
          <div className="flex gap-3 pt-2 transform transition-all duration-300 group-hover:translate-y-[-1px]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(product)}
              className="
                flex-1 border-pet-gold/30 text-pet-brown-dark hover:bg-pet-gold/10
                transform transition-all duration-300 hover:scale-105 hover:-translate-y-0.5
                shadow-sm hover:shadow-md backdrop-blur-sm
              "
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
            <Button
              size="sm"
              onClick={() => onWhatsApp(selectedSize, selectedColor)}
              className="
                flex-1 bg-gradient-to-r from-pet-gold to-yellow-500 hover:from-yellow-500 hover:to-pet-gold
                text-white shadow-lg hover:shadow-xl
                transform transition-all duration-300 hover:scale-105 hover:-translate-y-0.5
                border border-white/20
              "
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Pedir Agora
            </Button>
          </div>
        </CardContent>
        
        {/* Bottom glow effect */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-pet-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Card>
    </div>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}