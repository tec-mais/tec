'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageCircle, ShoppingBag, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'AGUARDANDO_FRETE', label: 'Aguardando Frete', color: 'bg-warning text-warning-foreground' },
  { value: 'PAGO', label: 'Pago', color: 'bg-success text-white' },
  { value: 'EM_SEPARACAO', label: 'Em Separação', color: 'bg-primary text-primary-foreground' },
  { value: 'ENTREGUE', label: 'Entregue', color: 'bg-success text-white' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-destructive text-destructive-foreground' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadData = useCallback(() => {
    let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    query.then(({ data }) => {
      if (data) setOrders(data as Order[]);
      setLoading(false);
    });
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) { toast.error(error.message); return; }
    toast.success('Status atualizado');
    loadData();
  };

  const filtered = orders.filter((o) =>
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">{orders.length} pedido(s)</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-48"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const status = statusOptions.find((s) => s.value === order.status);
            return (
              <Card key={order.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">#{order.id.slice(0, 8)}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge className={status?.color}>{status?.label}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div><span className="text-muted-foreground">Cliente:</span> {order.customer_name || 'N/A'}</div>
                    <div><span className="text-muted-foreground">Telefone:</span> {order.customer_phone || 'N/A'}</div>
                    <div><span className="text-muted-foreground">Pagamento:</span> {order.payment_method}</div>
                    <div><span className="text-muted-foreground">Entrega:</span> {order.delivery_type === 'MANUAL' ? 'Combinar' : 'Retirar'}</div>
                  </div>

                  <div className="space-y-1">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span>R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between font-bold border-t border-border/50 pt-2">
                    <span>Total</span>
                    <span className="text-primary">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}>
                      <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {order.customer_phone && (
                      <a href={`https://wa.me/55${order.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp</Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
