import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Eye, Palette, Tag } from 'lucide-react';
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

  const generateWhatsAppLink = (product: Product, size?: string, color?: string) => {
    const colorName = color ? colors.find(c => c.id === color)?.name : '';
    const sizeInfo = size ? `tamanho ${size}` : '';
    const colorInfo = colorName ? `cor ${colorName}` : '';
    const productInfo = [sizeInfo, colorInfo].filter(Boolean).join(', ');
    
    const message = `Olá! Tenho interesse no produto: ${product.name}${productInfo ? ` (${productInfo})` : ''}`;
    return `https://wa.me/5511914608191?text=${encodeURIComponent(message)}`;
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
      
      {/* Hero Section */}
      <section 
        className="bg-gradient-warm text-white py-16 relative overflow-hidden"
        style={{
          backgroundImage: `url(${banner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="absolute inset-0 bg-gradient-warm/80"></div>
        <div className="container text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            Catálogo PelúciaPet
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow-md">
            Produtos de luxo para o conforto do seu pet
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => window.open('https://wa.me/5511914608191', '_blank')}
            className="bg-white text-pet-brown-dark hover:bg-pet-beige-light transition-all duration-300 shadow-warm"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Fale Conosco
          </Button>
        </div>
      </section>

      <div className="container py-12">
        {/* Filtros de categoria */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Categorias</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className="transition-all duration-300"
            >
              Todos os produtos
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.name ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.name)}
                className="transition-all duration-300"
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>
            ))}
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
                window.open(generateWhatsAppLink(product, size, color), '_blank')
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
    <Card className="overflow-hidden hover:shadow-warm transition-all duration-300 bg-white/80 backdrop-blur border-0">
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={currentImage || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          {product.is_custom_order && (
            <Badge className="absolute top-2 right-2 bg-pet-gold text-white">
              <Tag className="h-3 w-3 mr-1" />
              Sob encomenda
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="font-bold text-lg text-primary">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
          {product.observations && (
            <p className="text-xs text-pet-gold mt-1">{product.observations}</p>
          )}
        </div>

        {/* Seletor de cores */}
        {productColors.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <Palette className="h-3 w-3 mr-1" />
              Cores disponíveis:
            </Label>
            <div className="flex flex-wrap gap-2">
              {productColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(selectedColor === color.id ? '' : color.id)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
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
              <p className="text-xs text-muted-foreground">
                Cor selecionada: {productColors.find(c => c.id === selectedColor)?.name}
              </p>
            )}
          </div>
        )}

        {/* Tabela de preços compacta */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tamanhos e preços:</Label>
          <div className="grid grid-cols-2 gap-1">
            {product.product_prices.map((price) => (
              <div
                key={price.size}
                onClick={() => setSelectedSize(selectedSize === price.size ? '' : price.size)}
                className={`cursor-pointer border rounded text-xs px-2 py-1 transition-all duration-200 hover:shadow-sm ${
                  selectedSize === price.size 
                    ? 'bg-pet-gold text-white border-pet-gold' 
                    : 'bg-white border-gray-200 hover:border-pet-gold'
                }`}
              >
                <div className="flex items-center justify-between leading-tight">
                  <span className="font-medium">{price.size}</span>
                  <span className="font-semibold">R$ {price.price.toFixed(2)}</span>
                </div>
                {price.sizes?.dimensions && (
                  <div className="text-xs opacity-75 leading-tight">
                    {price.sizes.dimensions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(product)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          <Button
            size="sm"
            onClick={() => onWhatsApp(selectedSize, selectedColor)}
            className="flex-1 bg-gradient-warm hover:bg-gradient-elegant transition-all duration-300"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Pedir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}