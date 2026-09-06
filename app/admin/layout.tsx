'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, hasRole } from '@/lib/auth-context';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Sparkles, Menu } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (profile && !hasRole(profile, 'ADMIN', 'PROPRIETARIO', 'OPERADOR')) {
        router.push('/');
      }
    }
  }, [user, profile, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary animate-pulse mb-2" />
          <p className="text-muted-foreground text-sm">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (profile && !hasRole(profile, 'ADMIN', 'PROPRIETARIO', 'OPERADOR')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Acesso negado. Você não tem permissão para acessar o painel.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="md:hidden h-14 border-b border-border/50 flex items-center justify-between px-4 sticky top-0 bg-card/80 backdrop-blur z-30">
          <button onClick={() => {
            const sidebar = document.querySelector('aside');
            sidebar?.classList.toggle('translate-x-0');
          }} className="flex items-center gap-2">
            <Menu className="h-5 w-5" />
            <img src="/logo-icon.svg" alt="TEC+" className="h-6 w-auto" />
          </button>
        </div>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
