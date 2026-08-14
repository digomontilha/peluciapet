import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Hash, Image as ImageIcon, Package2, Save, Scissors, Upload, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  COMMERCIAL_LINES,
  CommercialLine,
  getCommercialLineLabel,
  makePriceKey,
  validateCommercialProduct,
} from '@/lib/product-commercial';

interface Category { id: string; name: string; icon: string | null }
interface Fabric {
  id: string;
  name: string;
  commercial_line: CommercialLine;
  description: string | null;
  is_active: boolean;
  display_order: number;
}
interface ProductFabric {
  id?: string;
  fabric_id: string;
  is_available: boolean;
  display_order: number;
}
interface ProductSize { id: string; name: string; dimensions: string; display_order: number }
interface PriceValue { price: number; pixPrice: number }
interface ExistingPrice extends PriceValue { id: string; sizeId: string; line: CommercialLine }
interface Color { id: string; name: string; hex_code: string }
interface ExistingImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  color_id: string | null;
  stock_quantity: number;
  is_available: boolean;
  display_order: number;
}
interface NewImage {
  file: File;
  preview_url: string;
  color_id: string | null;
  stock_quantity: number;
  is_available: boolean;
  display_order: number;
}

const emptyProduct = {
  name: '',
  description: '',
  product_code: '',
  category_id: '',
  observations: '',
  is_custom_order: false,
  status: 'draft' as 'active' | 'inactive' | 'draft',
};

export default function ProductForm() {
  useNoindex();
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [productData, setProductData] = useState(emptyProduct);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [selectedLines, setSelectedLines] = useState<CommercialLine[]>([]);
  const [productFabrics, setProductFabrics] = useState<Record<string, ProductFabric>>({});
  const [initialFabricRows, setInitialFabricRows] = useState<ProductFabric[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceValue>>({});
  const [initialPrices, setInitialPrices] = useState<ExistingPrice[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [categoriesResult, fabricsResult, colorsResult] = await Promise.all([
        supabase.from('categories').select('id, name, icon').order('name'),
        supabase.from('fabrics').select('*').order('commercial_line').order('display_order').order('name'),
        supabase.from('colors').select('id, name, hex_code').order('name'),
      ]);
      if (categoriesResult.error) throw categoriesResult.error;
      if (fabricsResult.error) throw fabricsResult.error;
      if (colorsResult.error) throw colorsResult.error;

      const loadedFabrics = (fabricsResult.data || []) as Fabric[];
      setCategories(categoriesResult.data || []);
      setFabrics(loadedFabrics);
      setColors(colorsResult.data || []);

      if (!id) return;

      const [productResult, sizesResult, pricesResult, associationsResult, imagesResult] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('product_sizes').select('id, name, dimensions, display_order').eq('product_id', id).order('display_order'),
        supabase.from('product_prices').select('*').eq('product_id', id),
        supabase.from('product_fabrics').select('*').eq('product_id', id),
        supabase.from('product_images').select('*').eq('product_id', id).order('display_order'),
      ]);
      if (productResult.error) throw productResult.error;
      if (sizesResult.error) throw sizesResult.error;
      if (pricesResult.error) throw pricesResult.error;
      if (associationsResult.error) throw associationsResult.error;
      if (imagesResult.error) throw imagesResult.error;

      const product = productResult.data;
      setProductData({
        name: product.name || '',
        description: product.description || '',
        product_code: product.product_code || '',
        category_id: product.category_id || '',
        observations: product.observations || '',
        is_custom_order: Boolean(product.is_custom_order),
        status: (product.status as 'active' | 'inactive' | 'draft') || 'draft',
      });
      setSizes(sizesResult.data || []);

      const associations = (associationsResult.data || []) as ProductFabric[];
      setInitialFabricRows(associations);
      setProductFabrics(Object.fromEntries(associations.map((row) => [row.fabric_id, row])));

      const commercialPrices = (pricesResult.data || [])
        .filter((row) => row.commercial_line === 'essential' || row.commercial_line === 'premium')
        .map((row) => ({
          id: row.id,
          sizeId: row.product_size_id || '',
          line: row.commercial_line as CommercialLine,
          price: Number(row.price) || 0,
          pixPrice: Number(row.pix_price) || 0,
        }));
      setInitialPrices(commercialPrices);
      setPrices(Object.fromEntries(commercialPrices.map((row) => [makePriceKey(row.sizeId, row.line), { price: row.price, pixPrice: row.pixPrice }])));

      const linesFromAssociations = associations
        .map((association) => loadedFabrics.find((fabric) => fabric.id === association.fabric_id)?.commercial_line)
        .filter((line): line is CommercialLine => Boolean(line));
      const linesFromPrices = commercialPrices.map((price) => price.line);
      setSelectedLines(Array.from(new Set([...linesFromAssociations, ...linesFromPrices])));

      setExistingImages((imagesResult.data || []).map((image) => ({
        id: image.id,
        image_url: image.image_url,
        alt_text: image.alt_text,
        color_id: image.color_id,
        stock_quantity: Number(image.stock_quantity) || 0,
        is_available: image.is_available !== false,
        display_order: Number(image.display_order) || 0,
      })));
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast({ title: 'Erro ao carregar dados', description: 'Não foi possível carregar os dados comerciais do produto.', variant: 'destructive' });
      if (id) navigate('/admin/products');
    } finally {
      setLoadingData(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/auth');
      return;
    }
    if (isAdmin) void fetchData();
  }, [authLoading, fetchData, isAdmin, navigate]);

  const selectedFabricRows = useMemo(
    () => Object.values(productFabrics).filter((association) => {
      const fabric = fabrics.find((item) => item.id === association.fabric_id);
      return fabric && selectedLines.includes(fabric.commercial_line);
    }),
    [fabrics, productFabrics, selectedLines],
  );

  const toggleLine = (line: CommercialLine, checked: boolean) => {
    setSelectedLines((current) => checked ? [...current, line] : current.filter((item) => item !== line));
  };

  const toggleFabric = (fabric: Fabric, checked: boolean) => {
    setProductFabrics((current) => {
      if (!checked) {
        const next = { ...current };
        delete next[fabric.id];
        return next;
      }
      return { ...current, [fabric.id]: { fabric_id: fabric.id, is_available: true, display_order: fabric.display_order } };
    });
  };

  const setPriceValue = (sizeId: string, line: CommercialLine, field: keyof PriceValue, value: string) => {
    const key = makePriceKey(sizeId, line);
    setPrices((current) => ({
      ...current,
      [key]: { price: current[key]?.price || 0, pixPrice: current[key]?.pixPrice || 0, [field]: Number(value) || 0 },
    }));
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files).filter((file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    if (accepted.length !== files.length) {
      toast({ title: 'Arquivos inválidos', description: 'Apenas imagens de até 5 MB são permitidas.', variant: 'destructive' });
    }
    setNewImages((current) => [
      ...current,
      ...accepted.map((file, index) => ({ file, preview_url: URL.createObjectURL(file), color_id: null, stock_quantity: 0, is_available: true, display_order: existingImages.length + current.length + index })),
    ]);
  };

  const syncCommercialData = async (productId: string) => {
    const desiredFabricRows = selectedFabricRows.map((row) => ({
      product_id: productId,
      fabric_id: row.fabric_id,
      is_available: row.is_available,
      display_order: Number(row.display_order) || 0,
    }));
    if (desiredFabricRows.length) {
      const { error } = await supabase.from('product_fabrics').upsert(desiredFabricRows, { onConflict: 'product_id,fabric_id' });
      if (error) throw error;
    }
    const desiredFabricIds = new Set(desiredFabricRows.map((row) => row.fabric_id));
    const fabricIdsToDelete = initialFabricRows.filter((row) => !desiredFabricIds.has(row.fabric_id)).map((row) => row.id).filter(Boolean) as string[];
    if (fabricIdsToDelete.length) {
      const { error } = await supabase.from('product_fabrics').delete().in('id', fabricIdsToDelete);
      if (error) throw error;
    }

    const desiredPrices = sizes.flatMap((size) => selectedLines.flatMap((line) => {
      const value = prices[makePriceKey(size.id, line)];
      if (!value?.price || value.price <= 0) return [];
      return [{ product_id: productId, product_size_id: size.id, commercial_line: line, price: value.price, pix_price: value.pixPrice > 0 ? value.pixPrice : null, fabric_id: null }];
    }));
    if (desiredPrices.length) {
      const { error } = await supabase.from('product_prices').upsert(desiredPrices, { onConflict: 'product_id,product_size_id,commercial_line' });
      if (error) throw error;
    }
    const desiredPriceKeys = new Set(desiredPrices.map((row) => makePriceKey(row.product_size_id, row.commercial_line)));
    const priceIdsToDelete = initialPrices.filter((row) => !desiredPriceKeys.has(makePriceKey(row.sizeId, row.line))).map((row) => row.id);
    if (priceIdsToDelete.length) {
      const { error } = await supabase.from('product_prices').delete().in('id', priceIdsToDelete);
      if (error) throw error;
    }
  };

  const syncImages = async (productId: string) => {
    if (removedImageIds.length) {
      const { error } = await supabase.from('product_images').delete().in('id', removedImageIds);
      if (error) throw error;
    }
    await Promise.all(existingImages.map(async (image) => {
      const { error } = await supabase.from('product_images').update({ color_id: image.color_id, stock_quantity: image.stock_quantity, is_available: image.is_available, display_order: image.display_order }).eq('id', image.id);
      if (error) throw error;
    }));
    await Promise.all(newImages.map(async (image, index) => {
      const safeName = image.file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const fileName = `${productId}/${Date.now()}-${index}-${safeName}`;
      const upload = await supabase.storage.from('product-images').upload(fileName, image.file);
      if (upload.error) throw upload.error;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const { error } = await supabase.from('product_images').insert({ product_id: productId, image_url: urlData.publicUrl, alt_text: productData.name, color_id: image.color_id, stock_quantity: image.stock_quantity, is_available: image.is_available, display_order: image.display_order });
      if (error) throw error;
    }));
  };

  const handleSave = async () => {
    if (!productData.name.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Informe o nome do produto.', variant: 'destructive' });
      return;
    }
    const availableFabricLines = selectedFabricRows
      .filter((association) => association.is_available)
      .map((association) => fabrics.find((fabric) => fabric.id === association.fabric_id))
      .filter((fabric): fabric is Fabric => Boolean(fabric?.is_active))
      .map((fabric) => fabric.commercial_line);
    const validationIssues = validateCommercialProduct({ categoryId: productData.category_id, status: productData.status, sizeIds: sizes.map((size) => size.id), selectedLines, availableFabricLines, prices });
    if (validationIssues.length) {
      toast({ title: productData.status === 'active' ? 'Produto não pode ser publicado' : 'Revise o produto', description: validationIssues.join(' '), variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let productId = id;
      if (id) {
        const { error } = await supabase.from('products').update(productData).eq('id', id);
        if (error) throw error;
      } else {
        const codeResult = await supabase.rpc('generate_auto_product_code', { p_category_id: productData.category_id });
        if (codeResult.error) throw codeResult.error;
        const result = await supabase.from('products').insert({ ...productData, product_code: codeResult.data }).select('id').single();
        if (result.error) throw result.error;
        productId = result.data.id;
      }
      if (!productId) throw new Error('Produto não identificado.');
      await syncCommercialData(productId);
      await syncImages(productId);
      newImages.forEach((image) => URL.revokeObjectURL(image.preview_url));
      toast({ title: id ? 'Produto atualizado' : 'Rascunho criado', description: id ? 'As configurações comerciais foram salvas.' : 'Agora cadastre os tamanhos do produto.' });
      navigate(id ? '/admin/products' : `/admin/products/${productId}/sizes`);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({ title: 'Erro ao salvar produto', description: error instanceof Error ? error.message : 'Não foi possível salvar o produto.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingData || !isAdmin) {
    return <div className="min-h-screen bg-gradient-soft flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pet-gold" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <main className="container py-8 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-3xl font-bold text-primary">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h1><p className="text-muted-foreground">Configure o catálogo comercial sem transformar a jornada em checkout.</p></div>
          <Button variant="outline" onClick={() => navigate('/admin/products')}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
        </div>

        <Card className="bg-white/80 border-0 shadow-soft">
          <CardHeader><CardTitle>1. Informações do Produto</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="name">Nome *</Label><Input id="name" value={productData.name} onChange={(event) => setProductData((current) => ({ ...current, name: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Categoria *</Label><Select value={productData.category_id} onValueChange={(value) => setProductData((current) => ({ ...current, category_id: value }))}><SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.icon} {category.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="description">Descrição</Label><Textarea id="description" rows={4} value={productData.description} onChange={(event) => setProductData((current) => ({ ...current, description: event.target.value }))} /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="observations">Observações</Label><Input id="observations" value={productData.observations} onChange={(event) => setProductData((current) => ({ ...current, observations: event.target.value }))} /></div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-0 shadow-soft">
          <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
            <div><CardTitle>2. Linhas e Tecidos</CardTitle><CardDescription>Habilite somente as linhas vendidas por este produto e associe tecidos do cadastro global.</CardDescription></div>
            <Button variant="outline" onClick={() => navigate('/admin/fabrics')}><Scissors className="h-4 w-4 mr-2" /> Gerenciar tecidos</Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <fieldset><legend className="font-semibold mb-3">Linhas disponíveis *</legend><div className="grid gap-3 sm:grid-cols-2">{COMMERCIAL_LINES.map((line) => <label key={line.value} className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer"><Checkbox checked={selectedLines.includes(line.value)} onCheckedChange={(checked) => toggleLine(line.value, checked === true)} /><span><span className="font-semibold block">{line.label}</span><span className="text-sm text-muted-foreground">{line.description}</span></span></label>)}</div></fieldset>
            {COMMERCIAL_LINES.filter((line) => selectedLines.includes(line.value)).map((line) => {
              const lineFabrics = fabrics.filter((fabric) => fabric.commercial_line === line.value);
              const hasAvailable = lineFabrics.some((fabric) => productFabrics[fabric.id]?.is_available && fabric.is_active);
              return <fieldset key={line.value} className="rounded-xl border p-4"><legend className="font-bold px-2">{line.label.toUpperCase()}</legend><div className="space-y-3">{lineFabrics.map((fabric) => {
                const association = productFabrics[fabric.id];
                return <div key={fabric.id} className={`rounded-lg border p-3 ${!fabric.is_active ? 'opacity-60' : ''}`}><div className="flex items-start gap-3"><Checkbox checked={Boolean(association)} onCheckedChange={(checked) => toggleFabric(fabric, checked === true)} aria-label={`Associar tecido ${fabric.name}`} /><div className="flex-1"><p className="font-medium">{fabric.name} {!fabric.is_active && <Badge variant="secondary">Globalmente inativo</Badge>}</p>{fabric.description && <p className="text-sm text-muted-foreground">{fabric.description}</p>}</div></div>{association && <div className="mt-3 ml-7 grid gap-3 sm:grid-cols-2"><div className="flex items-center justify-between rounded-md bg-muted/50 px-3"><Label htmlFor={`available-${fabric.id}`}>Disponível</Label><Switch id={`available-${fabric.id}`} checked={association.is_available} onCheckedChange={(checked) => setProductFabrics((current) => ({ ...current, [fabric.id]: { ...association, is_available: checked } }))} /></div><div className="flex items-center gap-2"><Label htmlFor={`order-${fabric.id}`}>Ordem</Label><Input id={`order-${fabric.id}`} type="number" value={association.display_order} onChange={(event) => setProductFabrics((current) => ({ ...current, [fabric.id]: { ...association, display_order: Number(event.target.value) || 0 } }))} /></div></div>}</div>;
              })}{!lineFabrics.length && <p className="text-sm text-muted-foreground">Nenhum tecido cadastrado nesta linha.</p>}{!hasAvailable && <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Atenção</AlertTitle><AlertDescription>Associe e disponibilize ao menos um tecido {line.label} antes de publicar.</AlertDescription></Alert>}</div></fieldset>;
            })}
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-0 shadow-soft">
          <CardHeader className="sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>3. Tamanhos e Preços</CardTitle><CardDescription>O preço é definido por produto + tamanho + linha; tecido não altera o valor nesta fase.</CardDescription></div>{id && <Button variant="outline" onClick={() => navigate(`/admin/products/${id}/sizes`)}><Package2 className="h-4 w-4 mr-2" /> Gerenciar tamanhos</Button>}</CardHeader>
          <CardContent>{!id ? <Alert><Package2 className="h-4 w-4" /><AlertTitle>Salve o rascunho primeiro</AlertTitle><AlertDescription>Depois você será levado ao cadastro de tamanhos específicos deste produto.</AlertDescription></Alert> : !sizes.length ? <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Nenhum tamanho cadastrado</AlertTitle><AlertDescription>Cadastre os tamanhos reais do produto antes de preencher preços ou publicar.</AlertDescription></Alert> : !selectedLines.length ? <p className="text-sm text-muted-foreground">Habilite uma linha comercial para preencher os preços.</p> : <div className="space-y-4">{sizes.map((size) => <div key={size.id} className="rounded-xl border p-4"><div className="mb-3"><Badge>{size.name}</Badge><span className="text-sm text-muted-foreground ml-2">{size.dimensions}</span></div><div className="grid gap-4 lg:grid-cols-2">{selectedLines.map((line) => {
            const value = prices[makePriceKey(size.id, line)] || { price: 0, pixPrice: 0 };
            return <div key={line} className="rounded-lg bg-muted/40 p-3"><p className="font-semibold mb-3">{getCommercialLineLabel(line)}</p><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor={`price-${size.id}-${line}`}>Preço normal</Label><Input id={`price-${size.id}-${line}`} type="number" min="0" step="0.01" value={value.price || ''} onChange={(event) => setPriceValue(size.id, line, 'price', event.target.value)} placeholder="0,00" /></div><div className="space-y-1"><Label htmlFor={`pix-${size.id}-${line}`}>Preço Pix</Label><Input id={`pix-${size.id}-${line}`} type="number" min="0" step="0.01" value={value.pixPrice || ''} onChange={(event) => setPriceValue(size.id, line, 'pixPrice', event.target.value)} placeholder="0,00" /></div></div></div>;
          })}</div></div>)}</div>}</CardContent>
        </Card>

        <Card className="bg-white/80 border-0 shadow-soft">
          <CardHeader><CardTitle>4. Cores e Imagens</CardTitle><CardDescription>Associe cada foto a uma cor quando aplicável. Para produtos sob encomenda, estoque zero não desativa automaticamente a imagem.</CardDescription></CardHeader>
          <CardContent className="space-y-5"><div><input className="hidden" id="upload-images" type="file" accept="image/*" multiple onChange={(event) => handleImageUpload(event.target.files)} /><Label htmlFor="upload-images" className="flex min-h-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed"><Upload className="h-5 w-5 mr-2" /> Adicionar imagens</Label></div>
            {[...existingImages.map((image) => ({ kind: 'existing' as const, image })), ...newImages.map((image) => ({ kind: 'new' as const, image }))].map((entry, index) => {
              const image = entry.image;
              const preview = entry.kind === 'existing' ? image.image_url : image.preview_url;
              const update = (changes: Partial<ExistingImage & NewImage>) => {
                if (entry.kind === 'existing') setExistingImages((current) => current.map((item) => item.id === image.id ? { ...item, ...changes } : item));
                else setNewImages((current) => current.map((item) => item === image ? { ...item, ...changes } : item));
              };
              return <div key={entry.kind === 'existing' ? image.id : `${image.file.name}-${index}`} className="grid gap-4 rounded-xl border p-4 md:grid-cols-[120px_1fr_auto]"><img src={preview} alt={entry.kind === 'existing' ? image.alt_text || productData.name : `Prévia de ${image.file.name}`} className="h-24 w-full rounded-lg object-cover" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="space-y-1"><Label>Cor associada</Label><Select value={image.color_id || 'none'} onValueChange={(value) => update({ color_id: value === 'none' ? null : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem cor específica</SelectItem>{colors.map((color) => <SelectItem key={color.id} value={color.id}>{color.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Estoque</Label><Input type="number" min="0" value={image.stock_quantity} onChange={(event) => update({ stock_quantity: Number(event.target.value) || 0 })} /></div><div className="space-y-1"><Label>Ordem</Label><Input type="number" value={image.display_order} onChange={(event) => update({ display_order: Number(event.target.value) || 0 })} /></div><div className="flex items-center justify-between rounded-md bg-muted/50 px-3"><Label>Disponível</Label><Switch checked={image.is_available} onCheckedChange={(checked) => update({ is_available: checked })} /></div></div><Button variant="destructive" size="icon" aria-label="Remover imagem" onClick={() => entry.kind === 'existing' ? (setExistingImages((current) => current.filter((item) => item.id !== image.id)), setRemovedImageIds((current) => [...current, image.id])) : (URL.revokeObjectURL(image.preview_url), setNewImages((current) => current.filter((item) => item !== image)))}><X className="h-4 w-4" /></Button></div>;
            })}
            {!existingImages.length && !newImages.length && <div className="text-center text-muted-foreground py-6"><ImageIcon className="h-8 w-8 mx-auto mb-2" />Nenhuma imagem cadastrada.</div>}
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-0 shadow-soft"><CardHeader><CardTitle>5. Disponibilidade</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Status</Label><Select value={productData.status} onValueChange={(value: 'active' | 'inactive' | 'draft') => setProductData((current) => ({ ...current, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Rascunho</SelectItem><SelectItem value="active">Ativo / publicado</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">Produtos ativos precisam de tamanho, linha, tecido disponível e preços completos.</p></div><div className="flex items-center justify-between rounded-lg border p-4"><div><Label htmlFor="custom-order">Produto sob encomenda</Label><p className="text-xs text-muted-foreground mt-1">Pode permanecer disponível mesmo com estoque físico zero.</p></div><Switch id="custom-order" checked={productData.is_custom_order} onCheckedChange={(checked) => setProductData((current) => ({ ...current, is_custom_order: checked }))} /></div></CardContent></Card>

        {isEditing && <Card className="bg-white/80 border-0 shadow-soft"><CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold flex items-center gap-2"><Hash className="h-4 w-4" /> Variantes e códigos</p><p className="text-sm text-muted-foreground">Gerencie combinações de tamanho, cor e disponibilidade.</p></div><Button variant="outline" onClick={() => navigate(`/admin/variants?product=${id}`)}>Gerenciar variantes</Button></CardContent></Card>}
        <div className="flex justify-end gap-3"><Button variant="outline" disabled={saving} onClick={() => navigate('/admin/products')}>Cancelar</Button><Button disabled={saving} onClick={handleSave}><Save className="h-4 w-4 mr-2" />{saving ? 'Salvando…' : 'Salvar produto'}</Button></div>
      </main>
      <Footer />
    </div>
  );
}
