'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreFooter } from '@/components/storefront/store-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { Coupon, Fees } from '@/lib/types';
import { ArrowLeft, Tag, Check } from 'lucide-react';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [deliveryType, setDeliveryType] = useState<'MANUAL' | 'RETIRAR'>('MANUAL');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'DINHEIRO' | 'CARTAO'>('PIX');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [fees, setFees] = useState<Fees | null>(null);
  const [customerName, setCustomerName] = useState(profile?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    supabase.from('fees').select('*').maybeSingle().then(({ data }) => {
      if (data) setFees(data as Fees);
    });
    if (profile) {
      setCustomerName(profile.full_name);
      setCustomerPhone(profile.phone || '');
    }
  }, [profile]);

  const subtotal = total;
  const discountAmount = (() => {
    if (!coupon) return 0;
    if (subtotal < coupon.min_order) return 0;
    if (coupon.payment_method && coupon.payment_method !== paymentMethod) return 0;
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return 0;
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return 0;
    if (coupon.type === 'PERCENT') return (subtotal * coupon.value) / 100;
    return coupon.value;
  })();

  const convenienceFee = fees?.convenience_fee || 0;
  const deliveryMargin = deliveryType === 'MANUAL' ? (fees?.delivery_margin || 0) : 0;
  const feesTotal = convenienceFee + deliveryMargin;
  const grandTotal = subtotal - discountAmount + feesTotal;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCoupon(null);
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('active', true)
      .maybeSingle();

    if (!data) {
      toast.error('Cupom não encontrado ou inativo');
    } else {
      setCoupon(data as Coupon);
      toast.success('Cupom aplicado!');
    }
    setCouponLoading(false);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Faça login para finalizar a compra');
      router.push('/auth/login');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Preencha nome e telefone');
      return;
    }
    if (items.length === 0) return;

    setPlacing(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'AGUARDANDO_FRETE',
          total: grandTotal,
          subtotal,
          discount: discountAmount,
          fees: feesTotal,
          delivery_type: deliveryType,
          payment_method: paymentMethod,
          coupon_code: coupon?.code || null,
          customer_name: customerName,
          customer_phone: customerPhone,
          notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      for (const item of items) {
        await supabase
          .from('products')
          .update({ stock: Math.max(0, item.product.stock - item.quantity) })
          .eq('id', item.product.id);
      }

      if (coupon) {
        await supabase
          .from('coupons')
          .update({ used_count: coupon.used_count + 1 })
          .eq('id', coupon.id);
      }

      clearCart();
      toast.success('Pedido realizado com sucesso!');
      router.push('/orders');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar pedido');
    }
    setPlacing(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <StoreHeader />
        <main className="flex-1 container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Seu carrinho está vazio.</p>
          <Link href="/product"><Button>Ver Produtos</Button></Link>
        </main>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
        </Link>
        <h1 className="text-2xl font-bold mb-6">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Dados do Cliente</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp *</Label>
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(11) 99999-9999" required />
                </div>
                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alguma instrução para a entrega?" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Entrega</CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={deliveryType} onValueChange={(v) => setDeliveryType(v as any)}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 cursor-pointer">
                    <RadioGroupItem value="MANUAL" id="manual" />
                    <Label htmlFor="manual" className="cursor-pointer flex-1">
                      <span className="font-medium">Combinar Entrega com o Vendedor</span>
                      <p className="text-sm text-muted-foreground">Entraremos em contato para combinar a entrega</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 cursor-pointer">
                    <RadioGroupItem value="RETIRAR" id="retirar" />
                    <Label htmlFor="retirar" className="cursor-pointer flex-1">
                      <span className="font-medium">Retirar na Loja</span>
                      <p className="text-sm text-muted-foreground">Retire em nosso endereço físico</p>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Forma de Pagamento</CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 cursor-pointer">
                    <RadioGroupItem value="PIX" id="pix" />
                    <Label htmlFor="pix" className="cursor-pointer font-medium">PIX</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 cursor-pointer">
                    <RadioGroupItem value="DINHEIRO" id="dinheiro" />
                    <Label htmlFor="dinheiro" className="cursor-pointer font-medium">Dinheiro</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border/50 hover:border-primary/30 cursor-pointer">
                    <RadioGroupItem value="CARTAO" id="cartao" />
                    <Label htmlFor="cartao" className="cursor-pointer font-medium">Cartão</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Cupom de Desconto</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Digite o cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="secondary" onClick={applyCoupon} disabled={couponLoading}>
                    {couponLoading ? '...' : 'Aplicar'}
                  </Button>
                </div>
                {coupon && (
                  <Alert className="mt-3 border-success/30 bg-success/5">
                    <Check className="h-4 w-4 text-success" />
                    <AlertDescription>
                      Cupom <strong>{coupon.code}</strong> aplicado! Desconto de {coupon.type === 'PERCENT' ? `${coupon.value}%` : `R$ ${coupon.value}`}.
                    </AlertDescription>
                  </Alert>
                )}
                {coupon && subtotal < coupon.min_order && (
                  <p className="text-sm text-warning mt-2">
                    Pedido mínimo de R$ {coupon.min_order.toFixed(2)} para este cupom.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-20">
              <CardHeader><CardTitle>Resumo do Pedido</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground line-clamp-1">{item.quantity}x {item.product.name}</span>
                    <span>R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
                <div className="border-t border-border/50 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Desconto</span>
                      <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {feesTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxas</span>
                      <span>R$ {feesTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-border/50 pt-2">
                    <span>Total</span>
                    <span className="text-primary">R$ {grandTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
                <Button className="w-full" onClick={handlePlaceOrder} disabled={placing}>
                  {placing ? 'Processando...' : 'Confirmar Pedido'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
