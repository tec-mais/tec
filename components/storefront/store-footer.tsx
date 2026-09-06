'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FooterSettings } from '@/lib/types';
import { Instagram, Facebook, Youtube, Twitter, MessageCircle, Music2 } from 'lucide-react';

export function StoreFooter() {
  const [footer, setFooter] = useState<FooterSettings | null>(null);

  useEffect(() => {
    supabase.from('footer_settings').select('*').maybeSingle().then(({ data }) => {
      if (data) setFooter(data as FooterSettings);
    });
  }, []);

  const socials = [
    { icon: Instagram, url: footer?.social_instagram, label: 'Instagram' },
    { icon: Facebook, url: footer?.social_facebook, label: 'Facebook' },
    { icon: MessageCircle, url: footer?.social_whatsapp, label: 'WhatsApp' },
    { icon: Twitter, url: footer?.social_twitter, label: 'Twitter' },
    { icon: Youtube, url: footer?.social_youtube, label: 'YouTube' },
    { icon: Music2, url: footer?.social_tiktok, label: 'TikTok' },
  ].filter((s) => s.url);

  return (
    <footer className="border-t border-border/50 bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src="/logo.svg" alt="TEC+ Acessórios" className="h-10 w-auto mb-3" />
            <p className="text-sm text-muted-foreground line-clamp-4">
              {footer?.about_us || 'Sua loja de tecnologia e acessórios mobile.'}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 text-primary">Institucional</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/page/sobre" className="hover:text-primary transition-colors">Quem Somos</Link></li>
              <li><Link href="/page/termos" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
              <li><Link href="/page/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</Link></li>
              <li>
                <a href="https://www.gov.br/consumidor/pt-br/assuntos/cdc" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Código de Defesa do Consumidor (CDC)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 text-primary">Navegação</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Início</Link></li>
              <li><Link href="/product" className="hover:text-primary transition-colors">Produtos</Link></li>
              <li><Link href="/wishlist" className="hover:text-primary transition-colors">Sugestões</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 text-primary">Redes Sociais</h4>
            <div className="flex flex-wrap gap-3">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 hover:border-primary hover:text-primary transition-colors"
                  aria-label={s.label}
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TEC+ Acessórios. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
