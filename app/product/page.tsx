'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/lib/types';
import { ProductCard } from '@/components/storefront/product-card';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreFooter } from '@/components/storefront/store-footer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*, category:categories(*)').eq('active', true).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]).then(([prodRes, catRes]) => {
      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (catRes.data) setCategories(catRes.data as Category[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'name_asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'created_desc': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }

    return result;
  }, [products, selectedCategory, search, sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold">Produtos</h1>
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <aside className={cn('md:w-64 shrink-0', showFilters ? 'block' : 'hidden md:block')}>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2 text-primary">Categorias</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      'block w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                      selectedCategory === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                    )}
                  >
                    Todas
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        'block w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                        selectedCategory === cat.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 text-primary">Ordenar por</h3>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_desc">Mais Recentes</SelectItem>
                    <SelectItem value="price_asc">Menor Preço</SelectItem>
                    <SelectItem value="price_desc">Maior Preço</SelectItem>
                    <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl bg-card animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
                <p className="text-muted-foreground">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">{filtered.length} produto(s)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
