'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/lib/types';
import { BannerSlider } from '@/components/storefront/banner-slider';
import { ProductCard } from '@/components/storefront/product-card';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreFooter } from '@/components/storefront/store-footer';
import { Sparkles, TrendingUp, ShieldCheck, Truck } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*, category:categories(*)').eq('active', true).order('created_at', { ascending: false }).limit(12),
      supabase.from('categories').select('*').order('name'),
    ]).then(([prodRes, catRes]) => {
      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (catRes.data) setCategories(catRes.data as Category[]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-12">
        <BannerSlider />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Compra Segura</h3>
              <p className="text-xs text-muted-foreground">Dados protegidos e pagamento confiável</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Entrega Flexível</h3>
              <p className="text-xs text-muted-foreground">Combinar com vendedor ou retirar na loja</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Tecnologia de Ponta</h3>
              <p className="text-xs text-muted-foreground">Acessórios mobile selecionados</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Produtos em Destaque
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-xl bg-card animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
              <p className="text-muted-foreground">Nenhum produto disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
