'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreFooter } from '@/components/storefront/store-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/cart-context';
import { toast } from 'sonner';
import { ShoppingCart, Package, Minus, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (slug) {
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProduct(data as Product);
          setLoading(false);
        });
    }
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock <= 0) {
      toast.error('Produto sem estoque');
      return;
    }
    addItem(product, quantity);
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (product.stock <= 0) {
      toast.error('Produto sem estoque');
      return;
    }
    addItem(product, quantity);
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <StoreHeader />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square rounded-xl bg-card animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-card animate-pulse rounded" />
              <div className="h-4 bg-card animate-pulse rounded w-2/3" />
              <div className="h-24 bg-card animate-pulse rounded" />
            </div>
          </div>
        </div>
        <StoreFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <StoreHeader />
        <div className="flex-1 container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Produto não encontrado.</p>
          <Link href="/product"><Button>Voltar para produtos</Button></Link>
        </div>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link href="/product" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden border border-border/50 bg-card relative">
              {product.photos && product.photos.length > 0 ? (
                <img src={product.photos[activePhoto]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}
            </div>
            {product.photos && product.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-thin">
                {product.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`h-20 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activePhoto ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {product.category && (
              <Badge variant="outline" className="border-primary/30 text-primary">{product.category.name}</Badge>
            )}
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-3xl font-bold text-primary">
              R$ {Number(product.price).toFixed(2).replace('.', ',')}
            </p>

            {product.stock > 0 ? (
              <Badge className="bg-success text-white">Em estoque: {product.stock} unidade(s)</Badge>
            ) : (
              <Badge variant="destructive">Esgotado</Badge>
            )}

            {product.description && (
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center"
                  min={1}
                  max={product.stock}
                />
                <Button variant="outline" size="icon" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleAddToCart} variant="secondary" className="flex-1" disabled={product.stock <= 0}>
                <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar
              </Button>
              <Button onClick={handleBuyNow} className="flex-1" disabled={product.stock <= 0}>
                Comprar Agora
              </Button>
            </div>
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
