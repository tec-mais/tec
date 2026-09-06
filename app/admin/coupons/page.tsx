'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Coupon } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Ticket } from 'lucide-react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: '', type: 'PERCENT', value: '0', min_order: '0',
    payment_method: 'ANY', expires_at: '', usage_limit: '', active: true,
  });

  const loadData = useCallback(() => {
    supabase.from('coupons').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setCoupons(data as Coupon[]);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', type: 'PERCENT', value: '0', min_order: '0', payment_method: 'ANY', expires_at: '', usage_limit: '', active: true });
    setDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code, type: c.type, value: String(c.value), min_order: String(c.min_order),
      payment_method: c.payment_method || 'ANY',
      expires_at: c.expires_at ? c.expires_at.split('T')[0] : '',
      usage_limit: c.usage_limit ? String(c.usage_limit) : '',
      active: c.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      min_order: parseFloat(form.min_order),
      payment_method: form.payment_method === 'ANY' ? null : form.payment_method,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      active: form.active,
    };

    if (editing) {
      const { error } = await supabase.from('coupons').update(data).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Cupom atualizado');
    } else {
      const { error } = await supabase.from('coupons').insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success('Cupom criado');
    }
    setDialogOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cupom?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Cupom excluído');
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
          <p className="text-sm text-muted-foreground">{coupons.length} cupom(ns)</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Novo Cupom</Button>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
          <Ticket className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum cupom criado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg text-primary">{c.code}</span>
                  {c.active ? <Badge className="bg-success text-white">Ativo</Badge> : <Badge variant="destructive">Inativo</Badge>}
                </div>
                <p className="text-sm">{c.type === 'PERCENT' ? `${c.value}% de desconto` : `R$ ${c.value} de desconto`}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  {c.min_order > 0 && <p>Pedido mínimo: R$ {c.min_order.toFixed(2)}</p>}
                  {c.payment_method && <p>Pagamento: {c.payment_method}</p>}
                  {c.expires_at && <p>Expira: {new Date(c.expires_at).toLocaleDateString('pt-BR')}</p>}
                  {c.usage_limit && <p>Limite: {c.used_count}/{c.usage_limit}</p>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percentual (%)</SelectItem>
                    <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pedido Mínimo (R$)</Label>
              <Input type="number" step="0.01" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANY">Qualquer</SelectItem>
                    <SelectItem value="PIX">Somente PIX</SelectItem>
                    <SelectItem value="DINHEIRO">Somente Dinheiro</SelectItem>
                    <SelectItem value="CARTAO">Somente Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Limite de Usos</Label>
                <Input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Ilimitado" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expira em</Label>
              <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
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
