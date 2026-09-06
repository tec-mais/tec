'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingBag, Users, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    productCount: 0,
    orderCount: 0,
    userCount: 0,
    revenue: 0,
    lowStock: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id, stock', { count: 'exact' }),
      supabase.from('orders').select('id, total, status, created_at, customer_name'),
      supabase.from('profiles').select('id', { count: 'exact' }),
    ]).then(([prodRes, orderRes, userRes]) => {
      const products = prodRes.data || [];
      const orders = (orderRes.data || []) as any[];
      const lowStock = products.filter((p: any) => p.stock <= 5).length;
      const revenue = orders
        .filter((o) => o.status !== 'CANCELADO')
        .reduce((sum, o) => sum + Number(o.total), 0);
      const pending = orders.filter((o) => o.status === 'AGUARDANDO_FRETE').length;

      setStats({
        productCount: prodRes.count || 0,
        orderCount: orders.length,
        userCount: userRes.count || 0,
        revenue,
        lowStock,
        pendingOrders: pending,
      });
      setRecentOrders(orders.slice(0, 5));
      setLoading(false);
    });
  }, []);

  const statCards = [
    { label: 'Produtos', value: stats.productCount, icon: Package, color: 'text-primary' },
    { label: 'Pedidos', value: stats.orderCount, icon: ShoppingBag, color: 'text-primary' },
    { label: 'Usuários', value: stats.userCount, icon: Users, color: 'text-primary' },
    { label: 'Faturamento', value: `R$ ${stats.revenue.toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Bem-vindo, {profile?.full_name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" /> Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.lowStock > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/30">
                <span className="text-sm">Produtos com estoque baixo (≤5)</span>
                <Badge className="bg-warning text-warning-foreground">{stats.lowStock}</Badge>
              </div>
            )}
            {stats.pendingOrders > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
                <span className="text-sm">Pedidos aguardando frete</span>
                <Badge className="bg-primary text-primary-foreground">{stats.pendingOrders}</Badge>
              </div>
            )}
            {stats.lowStock === 0 && stats.pendingOrders === 0 && (
              <p className="text-sm text-muted-foreground">Tudo em ordem!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Pedidos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground line-clamp-1">{order.customer_name || 'Cliente'}</span>
                    <span className="font-semibold text-primary">R$ {Number(order.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
