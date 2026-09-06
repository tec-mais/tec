'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react';

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '0',
    stock: '0',
    photos: '',
    category_id: '',
    active: true,
  });

  const loadData = useCallback(() => {
    Promise.all([
      supabase.from('products').select('*, category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]).then(([prodRes, catRes]) => {
      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (catRes.data) setCategories(catRes.data as Category[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '0', stock: '0', photos: '', category_id: '', active: true });
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stock: String(product.stock),
      photos: product.photos?.join('\n') || '',
      category_id: product.category_id || '',
      active: product.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const photos = form.photos.split('\n').map((p) => p.trim()).filter(Boolean);
    const data = {
      name: form.name,
      slug: slugify(form.name) + '-' + Date.now().toString(36).slice(-4),
      description: form.description,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      photos,
      category_id: form.category_id || null,
      active: form.active,
    };

    if (editing) {
      const { error } = await supabase.from('products').update({
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        photos: data.photos,
        category_id: data.category_id,
        active: data.active,
      }).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Produto atualizado');
    } else {
      const { error } = await supabase.from('products').insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success('Produto criado');
    }
    setDialogOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Produto excluído');
    loadData();
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products.length} produto(s) cadastrado(s)</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Novo Produto</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produtos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
          <Package className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                    {product.photos?.[0] && <img src={product.photos[0]} alt={product.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                    <p className="text-primary font-bold">R$ {Number(product.price).toFixed(2).replace('.', ',')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">Estoque: {product.stock}</Badge>
                      {product.active ? <Badge className="bg-success text-white">Ativo</Badge> : <Badge variant="destructive">Inativo</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => openEdit(product)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (R$) *</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Estoque *</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fotos (URLs, uma por linha)</Label>
              <Textarea value={form.photos} onChange={(e) => setForm({ ...form, photos: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Produto ativo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
