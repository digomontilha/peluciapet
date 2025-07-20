import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ArrowLeft, Package, Hash, Palette, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProductVariant {
  id: string;
  product_id: string;
  product_size_id: string;
  color_id?: string;
  variant_code: string;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  products: {
    name: string;
    product_code: string;
  };
  colors?: {
    name: string;
    hex_code: string;
  };
  product_sizes?: {
    name: string;
    dimensions: string;
  };
}

interface Product {
  id: string;
  name: string;
  product_code: string;
}

interface Color {
  id: string;
  name: string;
  hex_code: string;
}


export default function ProductVariants() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [formData, setFormData] = useState({
    product_id: '',
    product_size_id: '',
    color_id: 'none',
    stock_quantity: 0,
    is_available: true
  });

  // Fetch data
  const { data: variants, isLoading } = useQuery({
    queryKey: ['product-variants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          products!inner(name, product_code),
          colors(name, hex_code),
          product_sizes(name, dimensions)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: products } = useQuery({
    queryKey: ['products-for-variants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, product_code')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: colors } = useQuery({
    queryKey: ['colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: sizes } = useQuery({
    queryKey: ['product-sizes', formData.product_id],
    queryFn: async () => {
      if (!formData.product_id) return [];
      const { data, error } = await supabase
        .from('product_sizes')
        .select('*')
        .eq('product_id', formData.product_id)
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.product_id
  });

  // Generate variant code automatically
  const generateVariantCode = async (productId: string, colorId?: string): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_auto_variant_code', {
        p_product_id: productId,
        p_color_id: colorId || null
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating variant code:', error);
      // Fallback para código simples se a função falhar
      return `VAR-${Date.now()}`;
    }
  };

  // Create/Update variant mutation
  const saveVariantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Gerar código automaticamente
      const variantCode = await generateVariantCode(
        data.product_id, 
        data.color_id === 'none' ? undefined : data.color_id
      );

      const variantData = {
        ...data,
        color_id: data.color_id === 'none' ? null : data.color_id || null,
        variant_code: variantCode
      };

      if (editingVariant) {
        const { error } = await supabase
          .from('product_variants')
          .update(variantData)
          .eq('id', editingVariant.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_variants')
          .insert([variantData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      setIsDialogOpen(false);
      setEditingVariant(null);
      setFormData({ product_id: '', product_size_id: '', color_id: 'none', stock_quantity: 0, is_available: true });
      toast({
        title: editingVariant ? 'Variante atualizada' : 'Variante criada',
        description: editingVariant ? 'A variante foi atualizada com sucesso.' : 'A nova variante foi criada com sucesso.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message === 'duplicate key value violates unique constraint "product_variants_variant_code_key"' 
          ? 'Já existe uma variante com este código.' 
          : 'Ocorreu um erro ao salvar a variante.',
        variant: 'destructive'
      });
      console.error('Error saving variant:', error);
    }
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      toast({
        title: 'Variante excluída',
        description: 'A variante foi excluída com sucesso.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir a variante.',
        variant: 'destructive'
      });
      console.error('Error deleting variant:', error);
    }
  });

  const handleSave = () => {
    if (!formData.product_id || !formData.product_size_id) {
      toast({
        title: 'Erro',
        description: 'Produto e tamanho são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    saveVariantMutation.mutate(formData);
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      product_id: variant.product_id,
      product_size_id: variant.product_size_id,
      color_id: variant.color_id || 'none',
      stock_quantity: variant.stock_quantity,
      is_available: variant.is_available
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta variante?')) {
      deleteVariantMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingVariant(null);
    setFormData({ product_id: '', product_size_id: '', color_id: 'none', stock_quantity: 0, is_available: true });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando variantes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Variantes de Produtos</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          Gerencie códigos únicos para cada combinação de produto, tamanho e cor
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Variante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingVariant ? 'Editar Variante' : 'Nova Variante'}
              </DialogTitle>
              <DialogDescription>
                {editingVariant 
                  ? 'Atualize as informações da variante.'
                  : 'Crie uma nova variante de produto com código único.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product">Produto *</Label>
                <Select 
                  value={formData.product_id} 
                  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.product_code} - {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="size">Tamanho *</Label>
                <Select 
                  value={formData.product_size_id} 
                  onValueChange={(value) => setFormData({ ...formData, product_size_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes?.map((size) => (
                      <SelectItem key={size.id} value={size.id}>
                        {size.name} ({size.dimensions})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="color">Cor (opcional)</Label>
                <Select 
                  value={formData.color_id} 
                  onValueChange={(value) => setFormData({ ...formData, color_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cor (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cor específica</SelectItem>
                    {colors?.map((color) => (
                      <SelectItem key={color.id} value={color.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: color.hex_code }}
                          />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="stock">Quantidade em Estoque</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="available">Disponível para venda</Label>
              </div>
              
              {formData.product_id && formData.product_size_id && (
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">Código da Variante:</Label>
                  <p className="font-mono text-lg font-bold text-primary">
                    Será gerado automaticamente
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Baseado na categoria, cor e numeração automática
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saveVariantMutation.isPending}>
                {saveVariantMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {variants?.map((variant) => (
          <Card key={variant.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {variant.products.name}
                  </CardTitle>
                  <CardDescription>
                    {variant.products.product_code}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(variant)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(variant.id)}
                    disabled={deleteVariantMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono font-bold">
                  {variant.variant_code}
                </code>
              </div>
              
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Tamanho: {variant.product_sizes?.name}</span>
              </div>
              
              {variant.colors && (
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: variant.colors.hex_code }}
                    />
                    <span className="text-sm">{variant.colors.name}</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Estoque: </span>
                  <span className="font-medium">{variant.stock_quantity}</span>
                </div>
                <Badge variant={variant.is_available ? "default" : "secondary"}>
                  {variant.is_available ? "Disponível" : "Indisponível"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {variants?.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Nenhuma variante encontrada
          </p>
          <Button onClick={openCreateDialog} className="flex items-center gap-2 mx-auto">
            <Plus className="h-4 w-4" />
            Criar primeira variante
          </Button>
        </div>
      )}
    </div>
  );
}