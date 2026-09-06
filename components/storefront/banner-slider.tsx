'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Banner } from '@/lib/types';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    supabase
      .from('banners')
      .select('*')
      .eq('active', true)
      .order('order')
      .then(({ data }) => {
        if (data) setBanners(data as Banner[]);
      });
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % Math.max(banners.length, 1));
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % Math.max(banners.length, 1));
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [banners.length, next]);

  if (banners.length === 0) {
    return (
      <div className="relative h-[300px] md:h-[450px] rounded-2xl overflow-hidden bg-gradient-to-br from-secondary via-card to-background border border-border/50 flex items-center justify-center">
        <div className="text-center px-8">
          <img src="/logo.svg" alt="TEC+ Acessórios" className="mx-auto h-16 md:h-20 w-auto mb-4" />
          <p className="text-muted-foreground text-lg">Tecnologia e acessórios mobile de ponta</p>
        </div>
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>
    );
  }

  return (
    <div className="relative h-[300px] md:h-[450px] rounded-2xl overflow-hidden group">
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          {banner.link_url ? (
            <Link href={banner.link_url}>
              <img src={banner.image_url} alt={banner.title || ''} className="h-full w-full object-cover" />
            </Link>
          ) : (
            <img src={banner.image_url} alt={banner.title || ''} className="h-full w-full object-cover" />
          )}
          {banner.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-6">
              <h2 className="text-2xl font-bold text-foreground">{banner.title}</h2>
            </div>
          )}
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur hover:bg-primary hover:text-primary-foreground transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur hover:bg-primary hover:text-primary-foreground transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === current ? 'w-8 bg-primary' : 'w-2 bg-foreground/30'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
