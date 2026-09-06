'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { BlogPost } from '@/lib/types';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreFooter } from '@/components/storefront/store-footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Newspaper } from 'lucide-react';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setPosts(data as BlogPost[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Newspaper className="h-7 w-7 text-primary" /> Blog
        </h1>
        <p className="text-muted-foreground mb-8">Artigos e novidades sobre tecnologia e acessórios</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[16/10] rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
            <Newspaper className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum artigo publicado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="overflow-hidden h-full hover:border-primary/30 transition-all hover:glow-sm">
                  <div className="aspect-[16/10] overflow-hidden bg-secondary">
                    {post.cover_image ? (
                      <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Newspaper className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h2 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors">{post.title}</h2>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-primary/30 text-primary">#{tag}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.content?.replace(/[#*`]/g, '').slice(0, 120)}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
