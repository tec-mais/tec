'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ShoppingCart, User, Menu, X, LogOut, LayoutDashboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function StoreHeader() {
  const { profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('TEC+ Acessórios');

  useEffect(() => {
    supabase.from('store_settings').select('logo_url, store_name').maybeSingle().then(({ data }) => {
      if (data) {
        setLogoUrl(data.logo_url);
        setStoreName(data.store_name);
      }
    });
  }, []);

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/product', label: 'Produtos' },
    { href: '/wishlist', label: 'Sugestões' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-8 w-auto object-contain" />
            ) : (
              <img src="/logo.svg" alt="TEC+ Acessórios" className="h-8 w-auto object-contain" />
            )}
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-primary',
                  pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs bg-primary text-primary-foreground">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </Link>

          {profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                  <Badge variant="outline" className="mt-1 text-primary border-primary/30">{profile.role}</Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account"><User className="mr-2 h-4 w-4" />Minha Conta</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders"><ShoppingCart className="mr-2 h-4 w-4" />Meus Pedidos</Link>
                </DropdownMenuItem>
                {(profile.role === 'ADMIN' || profile.role === 'PROPRIETARIO' || profile.role === 'OPERADOR') && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Painel Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-primary">
                <User className="mr-2 h-4 w-4" />Entrar
              </Button>
            </Link>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-border/50 bg-card px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
