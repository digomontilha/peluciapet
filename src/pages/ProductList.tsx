import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Package, Plus, Search, Edit, Trash2, Eye, Power, PowerOff } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  product_code: string;
  status: string;
  is_custom_order: boolean;
  category_id: string;
  created_at: string;
  categories?: { name: string };
  product_images?: Array<{
    image_url: string;
    alt_text?: string;
  }>;
}

export default function ProductList() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    if (isAdmin) {
      fetchProducts();
    }
  }, [loading, isAdmin, navigate]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          product_images (
            image_url,
            alt_text
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });

      fetchProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: "Erro ao excluir produto",
        description: "Não foi possível excluir o produto.",
        variant: "destructive",
      });
    }
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'ativar' : 'desativar';
    
    if (!confirm(`Tem certeza que deseja ${actionText} este produto?`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: `Produto ${newStatus === 'active' ? 'ativado' : 'desativado'}`,
        description: `O produto foi ${newStatus === 'active' ? 'ativado e voltará a aparecer' : 'desativado e foi removido'} do catálogo.`,
      });

      fetchProducts();
    } catch (error) {
      console.error('Erro ao alterar status do produto:', error);
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do produto.",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pet-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      
      <div className="container py-4 md:py-8 px-4">
        <div className="flex flex-col gap-4 mb-6 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
              Gerenciar Produtos
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Visualize, edite e organize todos os produtos da PelúciaPet
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin')}
              className="hover:bg-pet-beige-light transition-all duration-300 text-sm"
              size="sm"
            >
              Voltar ao Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/admin/products/new')}
              className="bg-gradient-warm hover:bg-gradient-elegant transition-all duration-300 text-sm"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6 bg-white/80 backdrop-blur border-0 shadow-soft">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-pet-beige-medium focus:border-pet-gold"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de produtos */}
        {loadingProducts ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pet-gold"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur border-0 shadow-soft">
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-primary mb-2">
                {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca.'
                  : 'Comece adicionando seu primeiro produto.'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => navigate('/admin/products/new')}
                  className="bg-gradient-warm hover:bg-gradient-elegant transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Produto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="bg-white/80 backdrop-blur border-0 shadow-soft hover:shadow-warm transition-all duration-300">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Primeira linha mobile: Imagem e info básica */}
                    <div className="flex gap-4">
                      {/* Imagem do produto */}
                      <div className="flex-shrink-0">
                        {product.product_images && product.product_images.length > 0 ? (
                          <img
                            src={product.product_images[0].image_url}
                            alt={product.product_images[0].alt_text || product.name}
                            className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-lg border-2 border-pet-beige-medium"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 md:w-24 md:h-24 bg-pet-beige-light rounded-lg border-2 border-pet-beige-medium flex items-center justify-center">
                            <Package className="h-6 w-6 md:h-8 md:w-8 text-pet-brown-medium" />
                          </div>
                        )}
                      </div>
                      
                      {/* Informações básicas do produto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2">
                          <h3 className="text-base md:text-lg font-semibold text-primary truncate">
                            {product.name}
                          </h3>
                          
                          {/* Badges */}
                          <div className="flex flex-wrap gap-1 md:gap-2">
                            {product.product_code && (
                              <Badge variant="outline" className="text-xs">
                                {product.product_code}
                              </Badge>
                            )}
                            <Badge 
                              variant={product.status === 'active' ? 'default' : 'secondary'}
                              className={product.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {product.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {product.is_custom_order && (
                              <Badge variant="outline" className="border-pet-gold text-pet-gold text-xs">
                                Sob Encomenda
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Ações - visível em desktop */}
                      <div className="hidden md:flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                          className="hover:bg-pet-beige-light transition-all duration-300"
                          title="Editar produto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/variants?product=${product.id}`)}
                          className="hover:bg-pet-beige-light transition-all duration-300"
                          title="Gerenciar Variantes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleProductStatus(product.id, product.status)}
                          className={product.status === 'active' 
                            ? "hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-300"
                            : "hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all duration-300"
                          }
                          title={product.status === 'active' ? 'Desativar produto' : 'Ativar produto'}
                        >
                          {product.status === 'active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-300"
                          title="Excluir produto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Segunda linha: Descrição e detalhes */}
                    <div className="flex-1 space-y-2">
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex flex-col gap-1 text-xs md:text-sm text-muted-foreground">
                        {product.categories && (
                          <span>Categoria: {product.categories.name}</span>
                        )}
                        <div className="flex flex-col md:flex-row md:gap-4">
                          <span>
                            Criado em: {new Date(product.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          {product.product_images && (
                            <span>{product.product_images.length} imagem(ns)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Ações mobile - embaixo */}
                    <div className="flex md:hidden gap-1 pt-2 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                        className="flex-1 hover:bg-pet-beige-light transition-all duration-300 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/variants?product=${product.id}`)}
                        className="flex-1 hover:bg-pet-beige-light transition-all duration-300 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Variantes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleProductStatus(product.id, product.status)}
                        className={`flex-1 text-xs transition-all duration-300 ${
                          product.status === 'active' 
                            ? "hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                            : "hover:bg-green-50 hover:border-green-200 hover:text-green-600"
                        }`}
                      >
                        {product.status === 'active' ? (
                          <>
                            <PowerOff className="h-3 w-3 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Power className="h-3 w-3 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-300 text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}