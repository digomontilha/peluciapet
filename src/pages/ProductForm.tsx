import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Upload, X, Save, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  display_order: number;
}

interface ProductPrice {
  size_id: string;
  size_name: string;
  price: number;
}

export default function ProductForm() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    product_code: '',
    category_id: '',
    observations: '',
    is_custom_order: false,
    status: 'active' as 'active' | 'inactive' | 'draft'
  });
  
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [selectedImages, setSelectedImages] = useState<{[colorId: string]: File[]}>({});
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
      return;
    }
    if (isAdmin) {
      fetchData();
    }
  }, [loading, isAdmin, navigate]);

  const fetchProductData = async (productId: string) => {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      setProductData({
        name: product.name || '',
        description: product.description || '',
        product_code: product.product_code || '',
        category_id: product.category_id || '',
        observations: product.observations || '',
        is_custom_order: product.is_custom_order || false,
        status: (product.status as 'active' | 'inactive' | 'draft') || 'active'
      });

      // Buscar preços
      const { data: pricesData, error: pricesError } = await supabase
        .from('product_prices')
        .select('*')
        .eq('product_id', productId);

      if (pricesError) throw pricesError;

      // Buscar preços com os novos tamanhos
      const sizesResponse = await supabase.from('sizes').select('*').order('display_order');
      const sizesData = sizesResponse.data || [];
      
      const updatedPrices = sizesData.map(size => {
        const existingPrice = pricesData?.find(p => p.size === size.name);
        return {
          size_id: size.id,
          size_name: size.name,
          price: existingPrice?.price || 0
        };
      });

      setPrices(updatedPrices);

    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast({
        title: "Erro ao carregar produto",
        description: "Não foi possível carregar os dados do produto.",
        variant: "destructive",
      });
      navigate('/admin/products');
    }
  };

  const fetchData = async () => {
    try {
      const [categoriesResult, colorsResult, sizesResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('colors').select('*').order('name'),
        supabase.from('sizes').select('*').order('display_order')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (colorsResult.error) throw colorsResult.error;
      if (sizesResult.error) throw sizesResult.error;

      setCategories(categoriesResult.data || []);
      setColors(colorsResult.data || []);
      setSizes(sizesResult.data || []);
      
      // Inicializar preços para os tamanhos disponíveis
      if (!isEditing) {
        const initialPrices = (sizesResult.data || []).map(size => ({
          size_id: size.id,
          size_name: size.name,
          price: 0
        }));
        setPrices(initialPrices);
      }
      
      // Se for edição, carregar dados do produto
      if (isEditing && id) {
        await fetchProductData(id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar categorias e cores.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleImageUpload = (colorId: string, files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB
    );
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Arquivos inválidos",
        description: "Apenas imagens até 5MB são permitidas.",
        variant: "destructive",
      });
    }
    
    setSelectedImages(prev => ({
      ...prev,
      [colorId]: [...(prev[colorId] || []), ...validFiles]
    }));
  };

  const removeImage = (colorId: string, index: number) => {
    setSelectedImages(prev => ({
      ...prev,
      [colorId]: prev[colorId]?.filter((_, i) => i !== index) || []
    }));
  };

  const uploadProductImages = async (productId: string) => {
    const uploadPromises: Promise<any>[] = [];
    
    for (const [colorId, files] of Object.entries(selectedImages)) {
      files.forEach((file, index) => {
        const fileName = `${productId}/${colorId}/${Date.now()}-${index}-${file.name}`;
        
        uploadPromises.push(
          supabase.storage
            .from('product-images')
            .upload(fileName, file)
            .then(async ({ data, error }) => {
              if (error) throw error;
              
              const { data: urlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);
              
              return supabase.from('product_images').insert({
                product_id: productId,
                color_id: colorId,
                image_url: urlData.publicUrl,
                alt_text: `${productData.name} - ${colors.find(c => c.id === colorId)?.name}`,
                display_order: index
              });
            })
        );
      });
    }
    
    await Promise.all(uploadPromises);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Validações
      if (!productData.name.trim()) {
        throw new Error('Nome do produto é obrigatório');
      }
      
      if (!productData.category_id) {
        throw new Error('Categoria é obrigatória');
      }
      
      if (prices.some(p => p.price <= 0)) {
        throw new Error('Todos os preços devem ser maiores que zero');
      }
      
      let productId: string;
      
      if (isEditing && id) {
        // Atualizar produto existente
        const { error: productError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
        
        if (productError) throw productError;
        productId = id;
        
        // Remover preços antigos e inserir novos
        await supabase.from('product_prices').delete().eq('product_id', id);
        
      } else {
        // Criar novo produto
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();
        
        if (productError) throw productError;
        productId = product.id;
      }
      
      // Inserir preços
      const pricesData = prices.map(price => ({
        product_id: productId,
        size: price.size_name,
        price: price.price
      }));
      
      const { error: pricesError } = await supabase
        .from('product_prices')
        .insert(pricesData);
      
      if (pricesError) throw pricesError;
      
      // Upload de imagens (apenas se houver novas imagens)
      if (Object.values(selectedImages).some(files => files.length > 0)) {
        await uploadProductImages(productId);
      }
      
      toast({
        title: isEditing ? "Produto atualizado!" : "Produto criado!",
        description: `${productData.name} foi ${isEditing ? 'atualizado' : 'adicionado ao catálogo'}.`,
      });
      
      navigate('/admin/products');
      
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro ao salvar produto",
        description: error.message || "Não foi possível salvar o produto.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingData || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pet-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Edite as informações do produto' : 'Adicione um novo produto ao catálogo da PelúciaPet'}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/products')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações básicas */}
          <Card className="bg-white/80 backdrop-blur border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-primary">Informações do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do produto *</Label>
                <Input
                  id="name"
                  value={productData.name}
                  onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Caminha Luxo Pelúcia"
                  className="border-pet-beige-medium focus:border-pet-gold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_code">Código do Produto *</Label>
                <Input
                  id="product_code"
                  value={productData.product_code}
                  onChange={(e) => setProductData(prev => ({ ...prev, product_code: e.target.value.toUpperCase() }))}
                  placeholder="Ex: CAM001, ROU001"
                  className="border-pet-beige-medium focus:border-pet-gold font-mono"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Código único do produto (máx. 10 caracteres). Será usado para gerar códigos de variantes.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={productData.description}
                  onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição detalhada do produto..."
                  className="border-pet-beige-medium focus:border-pet-gold"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={productData.category_id} 
                  onValueChange={(value) => setProductData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger className="border-pet-beige-medium focus:border-pet-gold">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Input
                  id="observations"
                  value={productData.observations}
                  onChange={(e) => setProductData(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Ex: Sob encomenda, Promoção, etc."
                  className="border-pet-beige-medium focus:border-pet-gold"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="custom_order"
                  checked={productData.is_custom_order}
                  onCheckedChange={(checked) => setProductData(prev => ({ ...prev, is_custom_order: !!checked }))}
                />
                <Label htmlFor="custom_order">Produto sob encomenda</Label>
              </div>
            </CardContent>
          </Card>

          {/* Preços */}
          <Card className="bg-white/80 backdrop-blur border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-primary">Preços por Tamanho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {prices.map((price, index) => {
                const size = sizes.find(s => s.id === price.size_id);
                return (
                  <div key={price.size_id} className="flex items-center space-x-4">
                    <div className="w-16">
                      <Badge className="bg-pet-gold text-white font-bold">
                        {price.size_name}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {size?.dimensions}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price.price}
                      onChange={(e) => {
                        const newPrices = [...prices];
                        newPrices[index].price = parseFloat(e.target.value) || 0;
                        setPrices(newPrices);
                      }}
                      placeholder="0.00"
                      className="border-pet-beige-medium focus:border-pet-gold"
                    />
                    <span className="text-muted-foreground">R$</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Upload de imagens */}
        <Card className="mt-8 bg-white/80 backdrop-blur border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-primary">Imagens do Produto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Adicione imagens para cada cor disponível. Máximo 5MB por imagem.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {colors.map((color) => (
              <div key={color.id} className="border rounded-lg p-4 border-pet-beige-medium">
                <div className="flex items-center space-x-3 mb-4">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: color.hex_code }}
                  />
                  <Label className="font-medium">{color.name}</Label>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(color.id, e.target.files)}
                    className="hidden"
                    id={`upload-${color.id}`}
                  />
                  <Label
                    htmlFor={`upload-${color.id}`}
                    className="flex items-center justify-center w-full h-20 border-2 border-dashed border-pet-beige-medium rounded-lg cursor-pointer hover:border-pet-gold transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para adicionar imagens</span>
                    </div>
                  </Label>
                  
                  {selectedImages[color.id] && selectedImages[color.id].length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {selectedImages[color.id].map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index}`}
                            className="w-full h-16 object-cover rounded"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={() => removeImage(color.id, index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="mt-8 flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/products')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-warm hover:bg-gradient-elegant transition-all duration-300"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : (isEditing ? 'Atualizar Produto' : 'Salvar Produto')}
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}