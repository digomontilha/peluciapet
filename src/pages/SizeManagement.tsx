import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Save, X, Ruler } from 'lucide-react';

interface Size {
  id: string;
  name: string;
  dimensions: string;
  width_cm: number;
  height_cm: number;
  depth_cm: number;
  display_order: number;
}

export default function SizeManagement() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loadingSizes, setLoadingSizes] = useState(true);
  const [editingSize, setEditingSize] = useState<string | null>(null);
  const [newSize, setNewSize] = useState({
    name: '',
    width_cm: 0,
    height_cm: 0,
    depth_cm: 0,
    display_order: 0
  });
  const [editData, setEditData] = useState<Partial<Size>>({});

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
      fetchSizes();
    }
  }, [loading, isAdmin, navigate]);

  const fetchSizes = async () => {
    try {
      const { data, error } = await supabase
        .from('sizes')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setSizes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tamanhos:', error);
      toast({
        title: "Erro ao carregar tamanhos",
        description: "Não foi possível carregar a lista de tamanhos.",
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

      const dimensions = `${newSize.width_cm}x${newSize.height_cm}x${newSize.depth_cm}cm`;
      
      const { error } = await supabase
        .from('sizes')
        .insert({
          name: newSize.name.toUpperCase(),
          dimensions,
          width_cm: newSize.width_cm,
          height_cm: newSize.height_cm,
          depth_cm: newSize.depth_cm,
          display_order: newSize.display_order || (sizes.length + 1)
        });

      if (error) throw error;

      toast({
        title: "Tamanho adicionado",
        description: `Tamanho ${newSize.name} foi criado com sucesso.`,
      });

      setNewSize({ name: '', width_cm: 0, height_cm: 0, depth_cm: 0, display_order: 0 });
      fetchSizes();
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
      const dimensions = `${editData.width_cm}x${editData.height_cm}x${editData.depth_cm}cm`;
      
      const { error } = await supabase
        .from('sizes')
        .update({
          name: editData.name?.toUpperCase(),
          dimensions,
          width_cm: editData.width_cm,
          height_cm: editData.height_cm,
          depth_cm: editData.depth_cm,
          display_order: editData.display_order
        })
        .eq('id', sizeId);

      if (error) throw error;

      toast({
        title: "Tamanho atualizado",
        description: "O tamanho foi atualizado com sucesso.",
      });

      setEditingSize(null);
      setEditData({});
      fetchSizes();
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
        .from('sizes')
        .delete()
        .eq('id', sizeId);

      if (error) throw error;

      toast({
        title: "Tamanho excluído",
        description: `O tamanho ${sizeName} foi excluído com sucesso.`,
      });

      fetchSizes();
    } catch (error: any) {
      console.error('Erro ao excluir tamanho:', error);
      toast({
        title: "Erro ao excluir tamanho",
        description: error.message || "Não foi possível excluir o tamanho.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (size: Size) => {
    setEditingSize(size.id);
    setEditData(size);
  };

  const cancelEditing = () => {
    setEditingSize(null);
    setEditData({});
  };

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
      
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              Gerenciar Tamanhos
            </h1>
            <p className="text-muted-foreground">
              Configure os tamanhos e dimensões dos produtos
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin')}
            className="hover:bg-pet-beige-light transition-all duration-300"
          >
            Voltar ao Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Adicionar novo tamanho */}
          <Card className="bg-white/80 backdrop-blur border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-primary flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Novo Tamanho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do tamanho</Label>
                <Input
                  id="name"
                  value={newSize.name}
                  onChange={(e) => setNewSize(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: P, M, G, GG"
                  className="border-pet-beige-medium focus:border-pet-gold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="width">Largura (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    min="0"
                    value={newSize.width_cm}
                    onChange={(e) => setNewSize(prev => ({ ...prev, width_cm: parseInt(e.target.value) || 0 }))}
                    className="border-pet-beige-medium focus:border-pet-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="0"
                    value={newSize.height_cm}
                    onChange={(e) => setNewSize(prev => ({ ...prev, height_cm: parseInt(e.target.value) || 0 }))}
                    className="border-pet-beige-medium focus:border-pet-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depth">Profund. (cm)</Label>
                  <Input
                    id="depth"
                    type="number"
                    min="0"
                    value={newSize.depth_cm}
                    onChange={(e) => setNewSize(prev => ({ ...prev, depth_cm: parseInt(e.target.value) || 0 }))}
                    className="border-pet-beige-medium focus:border-pet-gold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Ordem de exibição</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={newSize.display_order}
                  onChange={(e) => setNewSize(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="border-pet-beige-medium focus:border-pet-gold"
                />
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
              <CardTitle className="text-primary flex items-center">
                <Ruler className="h-5 w-5 mr-2" />
                Tamanhos Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSizes ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pet-gold"></div>
                </div>
              ) : sizes.length === 0 ? (
                <div className="text-center py-8">
                  <Ruler className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum tamanho cadastrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sizes.map((size) => (
                    <div key={size.id} className="border rounded-lg p-4 border-pet-beige-light">
                      {editingSize === size.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editData.name || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                            className="border-pet-beige-medium focus:border-pet-gold"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              type="number"
                              value={editData.width_cm || 0}
                              onChange={(e) => setEditData(prev => ({ ...prev, width_cm: parseInt(e.target.value) || 0 }))}
                              className="border-pet-beige-medium focus:border-pet-gold"
                            />
                            <Input
                              type="number"
                              value={editData.height_cm || 0}
                              onChange={(e) => setEditData(prev => ({ ...prev, height_cm: parseInt(e.target.value) || 0 }))}
                              className="border-pet-beige-medium focus:border-pet-gold"
                            />
                            <Input
                              type="number"
                              value={editData.depth_cm || 0}
                              onChange={(e) => setEditData(prev => ({ ...prev, depth_cm: parseInt(e.target.value) || 0 }))}
                              className="border-pet-beige-medium focus:border-pet-gold"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateSize(size.id)}
                              className="bg-gradient-warm hover:bg-gradient-elegant"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <Badge className="bg-pet-gold text-white font-bold text-lg px-3 py-1">
                                {size.name}
                              </Badge>
                              <span className="text-muted-foreground">
                                {size.dimensions}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Ordem: {size.display_order}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(size)}
                              className="hover:bg-pet-beige-light"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSize(size.id, size.name)}
                              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
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