'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Order } from '@/lib/types';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreFooter } from '@/components/storefront/store-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, MessageCircle } from 'lucide-react';

const statusLabels: Record<string, { label: string; color: string }> = {
  AGUARDANDO_FRETE: { label: 'Aguardando Frete', color: 'bg-warning text-warning-foreground' },
  PAGO: { label: 'Pago', color: 'bg-success text-white' },
  EM_SEPARACAO: { label: 'Em Separação', color: 'bg-primary text-primary-foreground' },
  ENTREGUE: { label: 'Entregue', color: 'bg-success text-white' },
  CANCELADO: { label: 'Cancelado', color: 'bg-destructive text-destructive-foreground' },
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setOrders(data as Order[]);
        });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meus Pedidos</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
            <Package className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {orders.map((order) => {
              const status = statusLabels[order.status] || statusLabels.AGUARDANDO_FRETE;
              return (
                <Card key={order.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Pedido #{order.id.slice(0, 8)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span>R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                    <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
                    </div>
                    {order.customer_phone && (
                      <a
                        href={`https://wa.me/55${order.customer_phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="mt-2">
                          <MessageCircle className="mr-2 h-4 w-4" /> Falar no WhatsApp
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
