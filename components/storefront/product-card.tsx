'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/cart-context';
import type { Product } from '@/lib/types';
import { toast } from 'sonner';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) {
      toast.error('Produto sem estoque');
      return;
    }
    addItem(product, 1);
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card hover:border-primary/50 transition-all duration-300 hover:glow-sm">
        <div className="aspect-square overflow-hidden bg-secondary relative">
          {product.photos && product.photos.length > 0 ? (
            <img
              src={product.photos[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <Badge variant="destructive">Esgotado</Badge>
            </div>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <Badge className="absolute top-2 right-2 bg-warning text-warning-foreground">
              Restam {product.stock}
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-bold text-primary">
              R$ {Number(product.price).toFixed(2).replace('.', ',')}
            </span>
            <Button size="sm" variant="secondary" onClick={handleAdd} disabled={product.stock <= 0}>
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
