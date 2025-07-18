import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ArrowLeft, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Color {
  id: string;
  name: string;
  hex_code: string;
  created_at: string;
}

export default function ColorManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    hex_code: '#000000'
  });

  // Fetch colors
  const { data: colors, isLoading } = useQuery({
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

  // Create/Update color mutation
  const saveColorMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingColor) {
        const { error } = await supabase
          .from('colors')
          .update(data)
          .eq('id', editingColor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('colors')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] });
      setIsDialogOpen(false);
      setEditingColor(null);
      setFormData({ name: '', hex_code: '#000000' });
      toast({
        title: editingColor ? 'Cor atualizada' : 'Cor criada',
        description: editingColor ? 'A cor foi atualizada com sucesso.' : 'A nova cor foi criada com sucesso.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar a cor.',
        variant: 'destructive'
      });
      console.error('Error saving color:', error);
    }
  });

  // Delete color mutation
  const deleteColorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('colors')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] });
      toast({
        title: 'Cor excluída',
        description: 'A cor foi excluída com sucesso.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir a cor.',
        variant: 'destructive'
      });
      console.error('Error deleting color:', error);
    }
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome da cor é obrigatório.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.hex_code.match(/^#[0-9A-Fa-f]{6}$/)) {
      toast({
        title: 'Erro',
        description: 'O código hexadecimal deve estar no formato #RRGGBB.',
        variant: 'destructive'
      });
      return;
    }

    saveColorMutation.mutate(formData);
  };

  const handleEdit = (color: Color) => {
    setEditingColor(color);
    setFormData({
      name: color.name,
      hex_code: color.hex_code
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta cor?')) {
      deleteColorMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingColor(null);
    setFormData({ name: '', hex_code: '#000000' });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando cores...</p>
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
        <h1 className="text-3xl font-bold">Gerenciar Cores</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          Gerencie as cores disponíveis para seus produtos
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Cor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingColor ? 'Editar Cor' : 'Nova Cor'}
              </DialogTitle>
              <DialogDescription>
                {editingColor 
                  ? 'Atualize as informações da cor.'
                  : 'Crie uma nova cor para seus produtos.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da cor"
                />
              </div>
              <div>
                <Label htmlFor="hex_code">Código Hexadecimal *</Label>
                <div className="flex gap-2">
                  <Input
                    id="hex_code"
                    value={formData.hex_code}
                    onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                  />
                  <div 
                    className="w-12 h-10 rounded border border-input"
                    style={{ backgroundColor: formData.hex_code }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saveColorMutation.isPending}>
                {saveColorMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {colors?.map((color) => (
          <Card key={color.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full border border-border"
                    style={{ backgroundColor: color.hex_code }}
                  />
                  <div>
                    <CardTitle className="text-lg">{color.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{color.hex_code}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(color)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(color.id)}
                    disabled={deleteColorMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {colors?.length === 0 && (
        <div className="text-center py-12">
          <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Nenhuma cor encontrada
          </p>
          <Button onClick={openCreateDialog} className="flex items-center gap-2 mx-auto">
            <Plus className="h-4 w-4" />
            Criar primeira cor
          </Button>
        </div>
      )}
    </div>
  );
}