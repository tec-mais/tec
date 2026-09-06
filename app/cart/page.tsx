'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreFooter } from '@/components/storefront/store-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <StoreHeader />
        <main className="flex-1 container mx-auto px-4 py-8 text-center">
          <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h1>
          <p className="text-muted-foreground mb-6">Adicione produtos para continuar</p>
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
        <Link href="/product" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Continuar comprando
        </Link>
        <h1 className="text-2xl font-bold mb-6">Carrinho ({itemCount} item(ns))</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <Card key={item.product.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-20 w-20 rounded-lg overflow-hidden bg-secondary shrink-0">
                    {item.product.photos?.[0] ? (
                      <img src={item.product.photos[0]} alt={item.product.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.product.slug}`} className="font-semibold hover:text-primary line-clamp-1">
                      {item.product.name}
                    </Link>
                    <p className="text-primary font-bold">R$ {Number(item.product.price).toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.product.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Card>
              <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <Button className="w-full" onClick={() => router.push('/checkout')}>
                  Finalizar Compra
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
