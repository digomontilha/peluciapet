import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useNoindex } from '@/hooks/use-noindex';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { COMMERCIAL_LINES, CommercialLine, getCommercialLineLabel } from '@/lib/product-commercial';

interface Fabric {
  id: string;
  name: string;
  commercial_line: CommercialLine;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

const emptyForm = {
  name: '',
  commercial_line: 'essential' as CommercialLine,
  description: '',
  is_active: true,
  display_order: 0,
};

export default function FabricManagement() {
  useNoindex();
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Fabric | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/auth');
    if (isAdmin) void fetchFabrics();
  }, [authLoading, isAdmin, navigate]);

  const fetchFabrics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fabrics')
      .select('*')
      .order('commercial_line')
      .order('display_order')
      .order('name');

    if (error) {
      toast({ title: 'Erro ao carregar tecidos', description: error.message, variant: 'destructive' });
    } else {
      setFabrics((data || []) as Fabric[]);
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (fabric: Fabric) => {
    setEditing(fabric);
    setForm({
      name: fabric.name,
      commercial_line: fabric.commercial_line,
      description: fabric.description || '',
      is_active: fabric.is_active,
      display_order: fabric.display_order,
    });
    setDialogOpen(true);
  };

  const saveFabric = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Informe o nome do tecido.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      commercial_line: form.commercial_line,
      description: form.description.trim() || null,
      is_active: form.is_active,
      display_order: Number(form.display_order) || 0,
    };
    const result = editing
      ? await supabase.from('fabrics').update(payload).eq('id', editing.id)
      : await supabase.from('fabrics').insert(payload);

    if (result.error) {
      const duplicate = result.error.code === '23505';
      toast({
        title: 'Erro ao salvar tecido',
        description: duplicate ? 'Já existe um tecido com esse nome nessa linha.' : result.error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: editing ? 'Tecido atualizado' : 'Tecido criado' });
      setDialogOpen(false);
      await fetchFabrics();
    }
    setSaving(false);
  };

  if (authLoading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Verificando permissões…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <main className="container py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Button variant="ghost" size="sm" className="mb-2 -ml-3" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
            <h1 className="text-3xl font-bold text-primary">Tecidos</h1>
            <p className="text-muted-foreground">Cadastre tecidos distintos e organize-os por linha comercial.</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Novo tecido</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando tecidos…</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {COMMERCIAL_LINES.map((line) => (
              <Card key={line.value} className="bg-white/80 border-0 shadow-soft">
                <CardHeader>
                  <CardTitle>{line.label}</CardTitle>
                  <CardDescription>{line.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fabrics.filter((fabric) => fabric.commercial_line === line.value).map((fabric) => (
                    <div key={fabric.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{fabric.name}</p>
                          <span className={`text-xs rounded-full px-2 py-0.5 ${fabric.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}`}>
                            {fabric.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                          <span className="text-xs text-muted-foreground">Ordem {fabric.display_order}</span>
                        </div>
                        {fabric.description && <p className="text-sm text-muted-foreground mt-1">{fabric.description}</p>}
                      </div>
                      <Button variant="outline" size="icon" aria-label={`Editar ${fabric.name}`} onClick={() => openEdit(fabric)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {fabrics.every((fabric) => fabric.commercial_line !== line.value) && (
                    <p className="text-sm text-muted-foreground">Nenhum tecido cadastrado em {getCommercialLineLabel(line.value)}.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar tecido' : 'Novo tecido'}</DialogTitle>
            <DialogDescription>Suede Texturizado e Suede Aveludado, por exemplo, devem ser cadastros separados.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fabric-name">Nome *</Label>
              <Input id="fabric-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Linha comercial *</Label>
              <Select value={form.commercial_line} onValueChange={(value: CommercialLine) => setForm((current) => ({ ...current, commercial_line: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMMERCIAL_LINES.map((line) => <SelectItem key={line.value} value={line.value}>{line.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fabric-description">Descrição</Label>
              <Textarea id="fabric-description" rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fabric-order">Ordem de exibição</Label>
              <Input id="fabric-order" type="number" value={form.display_order} onChange={(event) => setForm((current) => ({ ...current, display_order: Number(event.target.value) }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="fabric-active">Ativo</Label>
              <Switch id="fabric-active" checked={form.is_active} onCheckedChange={(checked) => setForm((current) => ({ ...current, is_active: checked }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveFabric} disabled={saving}>{saving ? 'Salvando…' : 'Salvar tecido'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
