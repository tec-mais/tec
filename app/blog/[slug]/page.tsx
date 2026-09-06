'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/lib/types';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreFooter } from '@/components/storefront/store-footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Newspaper, Calendar } from 'lucide-react';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setPost(data as BlogPost);
          setLoading(false);
        });
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <StoreHeader />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="h-8 bg-card animate-pulse rounded w-2/3" />
            <div className="h-64 bg-card animate-pulse rounded" />
            <div className="h-4 bg-card animate-pulse rounded" />
            <div className="h-4 bg-card animate-pulse rounded w-5/6" />
          </div>
        </div>
        <StoreFooter />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <StoreHeader />
        <div className="flex-1 container mx-auto px-4 py-8 text-center">
          <Newspaper className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">Artigo não encontrado.</p>
          <Link href="/blog"><Button>Ver todos os artigos</Button></Link>
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
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" /> Voltar ao blog
          </Link>

          {post.cover_image && (
            <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-8 border border-border/50">
              <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="space-y-4">
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-primary/30 text-primary">#{tag}</Badge>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{post.title}</h1>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>

            <div className="prose prose-invert prose-lg max-w-none pt-4">
              {post.content?.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-6 mb-2">{line.slice(2)}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-5 mb-2">{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
                if (line.startsWith('- ')) return <li key={i} className="ml-6 text-muted-foreground">{line.slice(2)}</li>;
                if (line.trim() === '') return <div key={i} className="h-3" />;
                return <p key={i} className="text-muted-foreground leading-relaxed">{line}</p>;
              })}
            </div>
          </div>
        </article>
      </main>
      <StoreFooter />
    </div>
  );
}
