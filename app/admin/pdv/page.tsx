'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, PaymentMethod } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Search, ShoppingCart, Trash2, Store, Plus, Minus, Check } from 'lucide-react';

interface CartLine {
  product: Product;
  quantity: number;
}

export default function AdminPDVPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    supabase.from('products').select('*, category:categories(*)').eq('active', true).order('name').then(({ data }) => {
      if (data) setProducts(data as Product[]);
    });
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) && p.stock > 0
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) => l.product.id === product.id ? { ...l, quantity: Math.min(product.stock, l.quantity + 1) } : l);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => prev.map((l) => {
      if (l.product.id === productId) {
        const newQty = Math.max(0, Math.min(l.product.stock, l.quantity + delta));
        return { ...l, quantity: newQty };
      }
      return l;
    }).filter((l) => l.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const total = cart.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Carrinho vazio'); return; }
    setProcessing(true);

    try {
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        status: 'PAGO',
        total,
        subtotal: total,
        discount: 0,
        fees: 0,
        delivery_type: 'RETIRAR',
        payment_method: paymentMethod,
        customer_name: customerName || 'Venda Presencial (PDV)',
        customer_phone: customerPhone || null,
      }).select().single();

      if (orderError) throw orderError;

      const orderItems = cart.map((l) => ({
        order_id: order.id,
        product_id: l.product.id,
        product_name: l.product.name,
        quantity: l.quantity,
        unit_price: l.product.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      for (const line of cart) {
        await supabase.from('products').update({ stock: Math.max(0, line.product.stock - line.quantity) }).eq('id', line.product.id);
      }

      toast.success('Venda registrada com sucesso!');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      supabase.from('products').select('*, category:categories(*)').eq('active', true).order('name').then(({ data }) => {
        if (data) setProducts(data as Product[]);
      });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar venda');
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Store className="h-6 w-6 text-primary" /> PDV - Ponto de Venda</h1>
        <p className="text-sm text-muted-foreground">Venda presencial com baixa instantânea de estoque</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-12 text-base" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="text-left p-3 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:glow-sm transition-all"
              >
                <div className="h-20 rounded-lg overflow-hidden bg-secondary mb-2">
                  {product.photos?.[0] ? <img src={product.photos[0]} alt={product.name} className="h-full w-full object-cover" /> : null}
                </div>
                <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
                <p className="text-primary font-bold text-sm">R$ {Number(product.price).toFixed(2).replace('.', ',')}</p>
                <Badge variant="outline" className="text-xs mt-1">Est: {product.stock}</Badge>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" /> Carrinho ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Carrinho vazio</p>
              ) : (
                <>
                  {cart.map((line) => (
                    <div key={line.product.id} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{line.product.name}</p>
                        <p className="text-xs text-primary">R$ {Number(line.product.price).toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(line.product.id, -1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-6 text-center text-sm">{line.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(line.product.id, 1)}><Plus className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(line.product.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-border/50 pt-3 space-y-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cliente (opcional)</Label>
                    <Input placeholder="Nome" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    <Input placeholder="Telefone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Pagamento</Label>
                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="flex gap-4">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="PIX" id="pdv-pix" /><Label htmlFor="pdv-pix">PIX</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="DINHEIRO" id="pdv-din" /><Label htmlFor="pdv-din">Dinheiro</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="CARTAO" id="pdv-card" /><Label htmlFor="pdv-card">Cartão</Label></div>
                    </RadioGroup>
                  </div>

                  <Button className="w-full" onClick={handleCheckout} disabled={processing}>
                    <Check className="mr-2 h-4 w-4" /> {processing ? 'Processando...' : 'Finalizar Venda'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
