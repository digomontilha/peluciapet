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
import { useNoindex } from '@/hooks/use-noindex';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  icon: string;
}


interface ProductPrice {
  size_id: string;
  size_name: string;
  price: number;
  dimensions?: string; // Adicionar dimensões aos dados de preço
}

interface ProductVariant {
  id?: string;
  size: string;
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
  
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{id: string; image_url: string; alt_text?: string; stock_quantity: number; is_available: boolean}>>([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showVariants, setShowVariants] = useState(false);

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
          price: existingPrice?.price || 0,
          dimensions: size.dimensions // Incluir dimensões
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

      // Converter para array simples
      const images = imagesData?.map(image => ({
        id: image.id,
        image_url: image.image_url,
        alt_text: image.alt_text,
        stock_quantity: image.stock_quantity || 0,
        is_available: image.is_available !== false
      })) || [];

      setExistingImages(images);

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
      const categoriesResult = await supabase.from('categories').select('*').order('name');

      if (categoriesResult.error) throw categoriesResult.error;

      setCategories(categoriesResult.data || []);
      
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
        description: "Não foi possível carregar categorias.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleImageUpload = (files: FileList | null) => {
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
    
    setSelectedImages([...selectedImages, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      // Atualizar o estado local
      setExistingImages(existingImages.filter(img => img.id !== imageId));

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

  const updateImageStock = async (imageId: string, newStock: number) => {
    try {
      const isAvailable = newStock > 0;
      
      const { error } = await supabase
        .from('product_images')
        .update({ 
          stock_quantity: newStock,
          is_available: isAvailable
        })
        .eq('id', imageId);

      if (error) throw error;

      // Atualizar o estado local
      setExistingImages(prevImages =>
        prevImages.map(img =>
          img.id === imageId
            ? { ...img, stock_quantity: newStock, is_available: isAvailable }
            : img
        )
      );

      if (newStock === 0) {
        toast({
          title: "Estoque zerado",
          description: "Imagem marcada como indisponível.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      toast({
        title: "Erro ao atualizar estoque",
        description: "Não foi possível atualizar o estoque da imagem.",
        variant: "destructive",
      });
    }
  };

  const uploadProductImages = async (productId: string) => {
    const uploadPromises: Promise<any>[] = [];
    
    selectedImages.forEach((file, index) => {
      const fileName = `${productId}/${Date.now()}-${index}-${file.name}`;
      
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
              image_url: urlData.publicUrl,
              alt_text: `${productData.name}`,
              display_order: index,
              stock_quantity: 5, // Estoque padrão para novas imagens
              is_available: true
            });
          })
      );
    });
    
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

        toast({
          title: "Produto criado!",
          description: "Adicione tamanhos e preços antes de publicar.",
        });
      }
      
      // Upload de imagens (apenas se houver novas imagens)
      if (selectedImages.length > 0) {
        await uploadProductImages(productId);
      }

      if (isEditing) {
        toast({
          title: "Produto atualizado!",
          description: `${productData.name} foi atualizado.`,
        });
      }

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
              {!isEditing ? (
                <div className="p-6 bg-muted rounded-lg text-center">
                  <Package2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    Tamanhos e Preços
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Os tamanhos padrão (P, M, G, GG) serão criados automaticamente após salvar o produto. 
                    Você poderá definir os preços específicos para cada tamanho na próxima etapa.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {['P', 'M', 'G', 'GG'].map((size, index) => (
                      <div key={size} className="bg-white rounded-lg p-3 border">
                        <Badge className="bg-pet-gold text-white font-bold mb-2">
                          {size}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {
                            index === 0 ? '50x40x17cm' :
                            index === 1 ? '60x50x17cm' :
                            index === 2 ? '70x60x17cm' :
                            '80x70x17cm'
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : prices.length > 0 ? (
                prices.map((price, index) => {
                  return (
                    <div key={price.size_id} className="flex items-center space-x-4">
                      <div className="w-16">
                        <Badge className="bg-pet-gold text-white font-bold">
                          {price.size_name}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {price.dimensions}
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
                })
              ) : (
                <div className="p-6 bg-muted rounded-lg text-center">
                  <p className="text-muted-foreground">
                    Nenhum tamanho configurado para este produto.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upload de imagens */}
        <Card className="mt-8 bg-white/80 backdrop-blur border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="text-primary">Imagens do Produto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Adicione imagens do produto. Máximo 5MB por imagem.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
                id="upload-images"
              />
              <Label
                htmlFor="upload-images"
                className="flex items-center justify-center w-full h-20 border-2 border-dashed border-pet-beige-medium rounded-lg cursor-pointer hover:border-pet-gold transition-colors"
              >
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para adicionar imagens</span>
                </div>
              </Label>
              
              {/* Imagens existentes */}
              {existingImages.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Imagens atuais com controle de estoque:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative border rounded-lg p-3 space-y-2">
                        <div className="relative">
                          <img
                            src={image.image_url}
                            alt={image.alt_text || `Imagem do produto`}
                            className={`w-full h-20 object-cover rounded ${
                              !image.is_available ? 'opacity-50 grayscale' : ''
                            }`}
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          {!image.is_available && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                              <span className="text-white text-xs font-bold">INDISPONÍVEL</span>
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={() => removeExistingImage(image.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Estoque</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="0"
                              value={image.stock_quantity}
                              onChange={(e) => {
                                const newStock = parseInt(e.target.value) || 0;
                                updateImageStock(image.id, newStock);
                              }}
                              className="h-8 text-sm"
                            />
                            <Badge 
                              variant={image.is_available ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {image.is_available ? "Disponível" : "Esgotado"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Novas imagens selecionadas */}
              {selectedImages.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Novas imagens a serem adicionadas:</p>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {selectedImages.map((file, index) => (
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
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                Gerencie códigos únicos e controle de estoque para cada combinação de tamanho.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Produto: <span className="text-primary">{productData.product_code}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    As variantes são geradas automaticamente baseadas no código do produto e tamanho.
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