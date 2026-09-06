'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { FooterSettings } from '@/lib/types';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreFooter } from '@/components/storefront/store-footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const pageMap: Record<string, { title: string; field: keyof FooterSettings }> = {
  sobre: { title: 'Quem Somos', field: 'about_us' },
  termos: { title: 'Termos de Uso', field: 'terms_of_use' },
  privacidade: { title: 'Política de Privacidade', field: 'privacy_policy' },
};

export default function InstitutionalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const config = pageMap[slug as string];

  useEffect(() => {
    supabase.from('footer_settings').select('*').maybeSingle().then(({ data }) => {
      if (data && config) {
        setContent((data as FooterSettings)[config.field] || '');
      }
      setLoading(false);
    });
  }, [config]);

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col">
        <StoreHeader />
        <div className="flex-1 container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Página não encontrada.</p>
          <Link href="/"><Button>Voltar ao início</Button></Link>
        </div>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <article className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="text-3xl font-bold mb-6">{config.title}</h1>
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 bg-card animate-pulse rounded" />
              <div className="h-4 bg-card animate-pulse rounded w-5/6" />
              <div className="h-4 bg-card animate-pulse rounded w-4/6" />
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{content}</p>
            </div>
          )}
        </article>
      </main>
      <StoreFooter />
    </div>
  );
}
