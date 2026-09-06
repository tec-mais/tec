'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth, hasRole } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Package, ShoppingBag, Ticket, DollarSign,
  FileText, Image as ImageIcon, Settings, Users, Store,
  Sparkles, LogOut, Menu, X, Footprints, Cpu
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'PROPRIETARIO', 'OPERADOR'] },
  { href: '/admin/pdv', label: 'PDV', icon: Store, roles: ['ADMIN', 'PROPRIETARIO', 'OPERADOR'] },
  { href: '/admin/products', label: 'Produtos', icon: Package, roles: ['ADMIN', 'PROPRIETARIO'] },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingBag, roles: ['ADMIN', 'PROPRIETARIO', 'OPERADOR'] },
  { href: '/admin/coupons', label: 'Cupons', icon: Ticket, roles: ['ADMIN', 'PROPRIETARIO'] },
  { href: '/admin/fees', label: 'Taxas', icon: DollarSign, roles: ['ADMIN', 'PROPRIETARIO'] },
  { href: '/admin/blog', label: 'Blog', icon: FileText, roles: ['ADMIN', 'PROPRIETARIO'] },
  { href: '/admin/users', label: 'Usuários', icon: Users, roles: ['ADMIN', 'PROPRIETARIO'] },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon, roles: ['ADMIN'] },
  { href: '/admin/footer', label: 'Rodapé', icon: Footprints, roles: ['ADMIN'] },
  { href: '/admin/brand', label: 'Marca & Logo', icon: Cpu, roles: ['ADMIN'] },
  { href: '/admin/ai', label: 'Config IA', icon: Sparkles, roles: ['ADMIN'] },
];

export function AdminSidebar() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('store_settings').select('logo_url').maybeSingle().then(({ data }) => {
      if (data) setLogoUrl(data.logo_url);
    });
  }, []);

  const filteredItems = navItems.filter((item) => hasRole(profile, item.roles[0]));

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        'fixed md:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 border-r border-border/50 bg-card flex flex-col transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-7 w-auto object-contain" />
            ) : (
              <img src="/logo-icon.svg" alt="TEC+" className="h-7 w-auto object-contain" />
            )}
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">Admin</Badge>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary glow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/50 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <Settings className="h-4 w-4" /> Ver Loja
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>
    </>
  );
}

export function AdminMobileNav() {
  const { profile } = useAuth();
  if (!hasRole(profile, 'ADMIN', 'PROPRIETARIO', 'OPERADOR')) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden fixed top-4 left-4 z-30"
      onClick={() => {
        const sidebar = document.querySelector('[data-mobile-toggle]');
        (sidebar as HTMLElement)?.click();
      }}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
