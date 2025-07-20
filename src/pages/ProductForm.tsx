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
import { Plus, Upload, X, Save, ArrowLeft, Hash, Package2 } from 'lucide-react';
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

interface ProductVariant {
  id?: string;
  size: string;
  color_id?: string;
  variant_code: string;
  stock_quantity: number;
  is_available: boolean;
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
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [selectedImages, setSelectedImages] = useState<{[colorId: string]: File[]}>({});
  const [existingImages, setExistingImages] = useState<{[colorId: string]: Array<{id: string; image_url: string; alt_text?: string}>}>({});
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showVariants, setShowVariants] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState<string>('');

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

      // Buscar preços com os tamanhos do produto
      const sizesResponse = await supabase
        .from('product_sizes')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');
      const sizesData = sizesResponse.data || [];
      
      const updatedPrices = sizesData.map(size => {
        const existingPrice = pricesData?.find(p => p.product_size_id === size.id);
        return {
          size_id: size.id,
          size_name: size.name,
          price: existingPrice?.price || 0
        };
      });

      setPrices(updatedPrices);

      // Buscar imagens existentes
      const { data: imagesData, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (imagesError) throw imagesError;

      // Agrupar imagens por cor
      const imagesByColor: {[colorId: string]: Array<{id: string; image_url: string; alt_text?: string}>} = {};
      imagesData?.forEach(image => {
        const colorId = image.color_id || 'no-color';
        if (!imagesByColor[colorId]) {
          imagesByColor[colorId] = [];
        }
        imagesByColor[colorId].push({
          id: image.id,
          image_url: image.image_url,
          alt_text: image.alt_text
        });
      });

      setExistingImages(imagesByColor);

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
      const [categoriesResult, colorsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('colors').select('*').order('name')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (colorsResult.error) throw colorsResult.error;

      setCategories(categoriesResult.data || []);
      setColors(colorsResult.data || []);
      
      // Para novos produtos, não inicializar preços ainda - será feito após salvar o produto
      if (!isEditing) {
        setPrices([]);
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

  const removeExistingImage = async (imageId: string, colorId: string) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      // Atualizar o estado local
      setExistingImages(prev => ({
        ...prev,
        [colorId]: prev[colorId]?.filter(img => img.id !== imageId) || []
      }));

      toast({
        title: "Imagem removida",
        description: "A imagem foi removida com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast({
        title: "Erro ao remover imagem",
        description: "Não foi possível remover a imagem.",
        variant: "destructive",
      });
    }
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
        // Gerar código do produto automaticamente
        const { data: generatedCode, error: codeError } = await supabase.rpc('generate_auto_product_code', {
          p_category_id: productData.category_id
        });
        
        if (codeError) throw codeError;
        
        const productDataWithCode = {
          ...productData,
          product_code: generatedCode
        };
        
        // Criar novo produto
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert(productDataWithCode)
          .select()
          .single();
        
        if (productError) throw productError;
        productId = product.id;
      }
      
      // Para novos produtos, criar tamanhos padrão e preços
      if (!isEditing) {
        // Criar tamanhos padrão para o produto
        const defaultSizes = [
          { name: 'P', dimensions: '50x40x17cm', width_cm: 50, height_cm: 40, depth_cm: 17, display_order: 1 },
          { name: 'M', dimensions: '60x50x17cm', width_cm: 60, height_cm: 50, depth_cm: 17, display_order: 2 },
          { name: 'G', dimensions: '70x60x17cm', width_cm: 70, height_cm: 60, depth_cm: 17, display_order: 3 },
          { name: 'GG', dimensions: '80x70x17cm', width_cm: 80, height_cm: 70, depth_cm: 17, display_order: 4 }
        ];

        const { data: sizesData, error: sizesError } = await supabase
          .from('product_sizes')
          .insert(defaultSizes.map(size => ({
            ...size,
            product_id: productId
          })))
          .select();

        if (sizesError) throw sizesError;

        // Criar preços padrão para todos os tamanhos
        const defaultPrices = sizesData?.map(size => ({
          product_id: productId,
          product_size_id: size.id,
          price: 100 // Preço padrão
        })) || [];

        const { error: pricesError } = await supabase
          .from('product_prices')
          .insert(defaultPrices);

        if (pricesError) throw pricesError;
      } else {
        // Para edição, apenas atualizar preços existentes se houver algum
        if (prices.length > 0) {
          const pricesData = prices.map(price => ({
            product_id: productId,
            product_size_id: price.size_id,
            price: price.price
          }));
          
          const { error: pricesError } = await supabase
            .from('product_prices')
            .insert(pricesData);
          
          if (pricesError) throw pricesError;
        }
      }
      
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


              {!isEditing && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 O código do produto será gerado automaticamente baseado na categoria selecionada
                  </p>
                </div>
              )}

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
              <CardTitle className="text-primary flex items-center justify-between">
                Preços por Tamanho
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/products/${id}/sizes`)}
                    className="flex items-center"
                  >
                    <Package2 className="h-4 w-4 mr-1" />
                    Gerenciar Tamanhos
                  </Button>
                )}
              </CardTitle>
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
              Selecione uma cor para visualizar e gerenciar suas imagens. Máximo 5MB por imagem.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seletor de Cor */}
            <div className="space-y-2">
              <Label htmlFor="color-selector">Selecionar Cor</Label>
              <Select 
                value={selectedColorId} 
                onValueChange={setSelectedColorId}
              >
                <SelectTrigger className="border-pet-beige-medium focus:border-pet-gold">
                  <SelectValue placeholder="Escolha uma cor para gerenciar imagens" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.hex_code }}
                        />
                        <span>{color.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Área de upload e visualização para a cor selecionada */}
            {selectedColorId && (
              <div className="border rounded-lg p-4 border-pet-beige-medium">
                <div className="flex items-center space-x-3 mb-4">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: colors.find(c => c.id === selectedColorId)?.hex_code }}
                  />
                  <Label className="font-medium">
                    {colors.find(c => c.id === selectedColorId)?.name}
                  </Label>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(selectedColorId, e.target.files)}
                    className="hidden"
                    id={`upload-${selectedColorId}`}
                  />
                  <Label
                    htmlFor={`upload-${selectedColorId}`}
                    className="flex items-center justify-center w-full h-20 border-2 border-dashed border-pet-beige-medium rounded-lg cursor-pointer hover:border-pet-gold transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para adicionar imagens</span>
                    </div>
                  </Label>
                  
                  {/* Imagens existentes */}
                  {existingImages[selectedColorId] && existingImages[selectedColorId].length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Imagens atuais:</p>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {existingImages[selectedColorId].map((image) => (
                          <div key={image.id} className="relative">
                            <img
                              src={image.image_url}
                              alt={image.alt_text || `Imagem ${colors.find(c => c.id === selectedColorId)?.name}`}
                              className="w-full h-16 object-cover rounded border-2 border-pet-beige-medium"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0"
                              onClick={() => removeExistingImage(image.id, selectedColorId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Novas imagens selecionadas */}
                  {selectedImages[selectedColorId] && selectedImages[selectedColorId].length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Novas imagens a serem adicionadas:</p>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {selectedImages[selectedColorId].map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index}`}
                              className="w-full h-16 object-cover rounded border-2 border-green-300"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0"
                              onClick={() => removeImage(selectedColorId, index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gestão Rápida de Variantes */}
        {isEditing && (
          <Card className="mt-8 bg-white/80 backdrop-blur border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Gestão de Variantes e Estoque
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Gerencie códigos únicos e controle de estoque para cada combinação de tamanho e cor.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Produto: <span className="text-primary">{productData.product_code}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    As variantes são geradas automaticamente baseadas no código do produto, tamanho e cor.
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/admin/variants?product=${id}`)}
                  className="bg-pet-brown-medium hover:bg-pet-brown-dark text-white"
                >
                  <Package2 className="h-4 w-4 mr-2" />
                  Gerenciar Variantes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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