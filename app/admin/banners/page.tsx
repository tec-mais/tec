'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Banner } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ image_url: '', link_url: '', title: '', order: '0', active: true });

  const loadData = useCallback(() => {
    supabase.from('banners').select('*').order('order').then(({ data }) => {
      if (data) setBanners(data as Banner[]);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ image_url: '', link_url: '', title: '', order: '0', active: true });
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ image_url: b.image_url, link_url: b.link_url || '', title: b.title || '', order: String(b.order), active: b.active });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      image_url: form.image_url,
      link_url: form.link_url || null,
      title: form.title || null,
      order: parseInt(form.order),
      active: form.active,
    };
    if (editing) {
      const { error } = await supabase.from('banners').update(data).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Banner atualizado');
    } else {
      const { error } = await supabase.from('banners').insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success('Banner criado');
    }
    setDialogOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este banner?')) return;
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Banner excluído');
    loadData();
  };

  const moveOrder = async (banner: Banner, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? banner.order - 1 : banner.order + 1;
    const { error } = await supabase.from('banners').update({ order: newOrder }).eq('id', banner.id);
    if (error) { toast.error(error.message); return; }
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banners Rotativos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os banners da home</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Novo Banner</Button>
      </div>

      {banners.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
          <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum banner criado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-16 w-28 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {b.image_url && <img src={b.image_url} alt={b.title || ''} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold line-clamp-1">{b.title || 'Sem título'}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{b.link_url || 'Sem link'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">Ordem: {b.order}</Badge>
                    {b.active ? <Badge className="bg-success text-white">Ativo</Badge> : <Badge variant="destructive">Inativo</Badge>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => moveOrder(b, 'up')}><ArrowUp className="h-3 w-3" /></Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => moveOrder(b, 'down')}><ArrowDown className="h-3 w-3" /></Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(b.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Banner' : 'Novo Banner'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>URL da Imagem *</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} required placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Link de Destino</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/product ou https://..." />
            </div>
            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Ativo</Label>
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
