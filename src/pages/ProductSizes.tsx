import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Pencil, Trash2, Save, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { toast } from "@/hooks/use-toast";

interface ProductSize {
  id: string;
  name: string;
  dimensions: string;
  width_cm: number | null;
  height_cm: number | null;
  depth_cm: number | null;
  display_order: number;
}

interface Product {
  id: string;
  name: string;
  product_code: string;
}

export default function ProductSizes() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { productId } = useParams();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [loadingSizes, setLoadingSizes] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSize, setNewSize] = useState({
    name: '',
    dimensions: '',
    width_cm: '',
    height_cm: '',
    depth_cm: '',
    display_order: 0
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
      return;
    }
    if (isAdmin && productId) {
      fetchProductAndSizes();
    }
  }, [loading, isAdmin, navigate, productId]);

  const fetchProductAndSizes = async () => {
    try {
      // Buscar dados do produto
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, name, product_code')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Buscar tamanhos do produto
      const { data, error } = await supabase
        .from('product_sizes')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (error) throw error;
      setSizes(data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do produto.",
        variant: "destructive",
      });
    } finally {
      setLoadingSizes(false);
    }
  };

  const handleAddSize = async () => {
    try {
      if (!newSize.name.trim()) {
        throw new Error('Nome do tamanho é obrigatório');
      }

      const { error } = await supabase
        .from('product_sizes')
        .insert({
          product_id: productId,
          name: newSize.name.trim(),
          dimensions: newSize.dimensions.trim(),
          width_cm: newSize.width_cm ? parseInt(newSize.width_cm) : null,
          height_cm: newSize.height_cm ? parseInt(newSize.height_cm) : null,
          depth_cm: newSize.depth_cm ? parseInt(newSize.depth_cm) : null,
          display_order: newSize.display_order || (sizes.length + 1)
        });

      if (error) throw error;

      toast({
        title: "Tamanho adicionado",
        description: `Tamanho ${newSize.name} foi criado com sucesso.`,
      });

      setNewSize({
        name: '',
        dimensions: '',
        width_cm: '',
        height_cm: '',
        depth_cm: '',
        display_order: 0
      });

      fetchProductAndSizes();
    } catch (error: any) {
      console.error('Erro ao adicionar tamanho:', error);
      toast({
        title: "Erro ao adicionar tamanho",
        description: error.message || "Não foi possível adicionar o tamanho.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSize = async (sizeId: string) => {
    try {
      const size = sizes.find(s => s.id === sizeId);
      if (!size) return;

      const { error } = await supabase
        .from('product_sizes')
        .update({
          name: size.name,
          dimensions: size.dimensions,
          width_cm: size.width_cm,
          height_cm: size.height_cm,
          depth_cm: size.depth_cm,
          display_order: size.display_order
        })
        .eq('id', sizeId);

      if (error) throw error;

      toast({
        title: "Tamanho atualizado",
        description: "O tamanho foi atualizado com sucesso.",
      });

      setEditingId(null);
      fetchProductAndSizes();
    } catch (error: any) {
      console.error('Erro ao atualizar tamanho:', error);
      toast({
        title: "Erro ao atualizar tamanho",
        description: error.message || "Não foi possível atualizar o tamanho.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSize = async (sizeId: string, sizeName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o tamanho "${sizeName}"?`)) return;

    try {
      const { error } = await supabase
        .from('product_sizes')
        .delete()
        .eq('id', sizeId);

      if (error) throw error;

      toast({
        title: "Tamanho excluído",
        description: `Tamanho "${sizeName}" foi excluído com sucesso.`,
      });

      fetchProductAndSizes();
    } catch (error: any) {
      console.error('Erro ao excluir tamanho:', error);
      toast({
        title: "Erro ao excluir tamanho",
        description: error.message || "Não foi possível excluir o tamanho.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (size: ProductSize) => {
    setEditingId(size.id);
  };

  const cancelEditing = () => {
    setEditingId(null);
    fetchProductAndSizes(); // Recarregar para desfazer mudanças não salvas
  };

  const updateSizeField = (sizeId: string, field: keyof ProductSize, value: any) => {
    setSizes(prev => prev.map(size => 
      size.id === sizeId 
        ? { ...size, [field]: value }
        : size
    ));
  };

  if (loading || loadingSizes || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pet-gold"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Card className="bg-white/80 backdrop-blur border-0 shadow-soft p-8">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Produto não encontrado</CardTitle>
            <CardDescription>O produto solicitado não foi encontrado.</CardDescription>
          </CardHeader>
          <div className="flex justify-center">
            <Button onClick={() => navigate('/admin/products')}>
              Voltar para Produtos
            </Button>
          </div>
        </Card>
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
              Tamanhos - {product.name}
            </h1>
            <p className="text-muted-foreground">
              Gerencie os tamanhos específicos para este produto
            </p>
            <Badge className="mt-2 bg-pet-gold text-white">
              Código: {product.product_code}
            </Badge>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Produtos
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Adicionar novo tamanho */}
          <Card className="bg-white/80 backdrop-blur border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Novo Tamanho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={newSize.name}
                  onChange={(e) => setNewSize(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: P, M, G, GG"
                  className="border-pet-beige-medium focus:border-pet-gold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensões *</Label>
                <Input
                  id="dimensions"
                  value={newSize.dimensions}
                  onChange={(e) => setNewSize(prev => ({ ...prev, dimensions: e.target.value }))}
                  placeholder="Ex: 50x40x17cm"
                  className="border-pet-beige-medium focus:border-pet-gold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="width">Largura (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={newSize.width_cm}
                    onChange={(e) => setNewSize(prev => ({ ...prev, width_cm: e.target.value }))}
                    placeholder="50"
                    className="border-pet-beige-medium focus:border-pet-gold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={newSize.height_cm}
                    onChange={(e) => setNewSize(prev => ({ ...prev, height_cm: e.target.value }))}
                    placeholder="40"
                    className="border-pet-beige-medium focus:border-pet-gold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depth">Profundidade (cm)</Label>
                  <Input
                    id="depth"
                    type="number"
                    value={newSize.depth_cm}
                    onChange={(e) => setNewSize(prev => ({ ...prev, depth_cm: e.target.value }))}
                    placeholder="17"
                    className="border-pet-beige-medium focus:border-pet-gold"
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddSize}
                className="w-full bg-gradient-warm hover:bg-gradient-elegant transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tamanho
              </Button>
            </CardContent>
          </Card>

          {/* Lista de tamanhos */}
          <Card className="bg-white/80 backdrop-blur border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-primary">Tamanhos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {sizes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum tamanho cadastrado para este produto
                </p>
              ) : (
                <div className="space-y-4">
                  {sizes.map((size) => (
                    <div key={size.id} className="border rounded-lg p-4 border-pet-beige-medium">
                      {editingId === size.id ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                              value={size.name}
                              onChange={(e) => updateSizeField(size.id, 'name', e.target.value)}
                              className="border-pet-beige-medium focus:border-pet-gold"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Dimensões</Label>
                            <Input
                              value={size.dimensions}
                              onChange={(e) => updateSizeField(size.id, 'dimensions', e.target.value)}
                              className="border-pet-beige-medium focus:border-pet-gold"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-2">
                              <Label>Largura (cm)</Label>
                              <Input
                                type="number"
                                value={size.width_cm || ''}
                                onChange={(e) => updateSizeField(size.id, 'width_cm', e.target.value ? parseInt(e.target.value) : null)}
                                className="border-pet-beige-medium focus:border-pet-gold"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Altura (cm)</Label>
                              <Input
                                type="number"
                                value={size.height_cm || ''}
                                onChange={(e) => updateSizeField(size.id, 'height_cm', e.target.value ? parseInt(e.target.value) : null)}
                                className="border-pet-beige-medium focus:border-pet-gold"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Profundidade (cm)</Label>
                              <Input
                                type="number"
                                value={size.depth_cm || ''}
                                onChange={(e) => updateSizeField(size.id, 'depth_cm', e.target.value ? parseInt(e.target.value) : null)}
                                className="border-pet-beige-medium focus:border-pet-gold"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUpdateSize(size.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Salvar
                            </Button>
                            <Button
                              onClick={cancelEditing}
                              variant="outline"
                              size="sm"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-pet-gold text-white font-bold">
                                {size.name}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {size.dimensions}
                            </p>
                            {(size.width_cm || size.height_cm || size.depth_cm) && (
                              <p className="text-xs text-muted-foreground">
                                {size.width_cm && `L: ${size.width_cm}cm`}
                                {size.width_cm && size.height_cm && ' • '}
                                {size.height_cm && `A: ${size.height_cm}cm`}
                                {(size.width_cm || size.height_cm) && size.depth_cm && ' • '}
                                {size.depth_cm && `P: ${size.depth_cm}cm`}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => startEditing(size)}
                              variant="outline"
                              size="sm"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteSize(size.id, size.name)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}