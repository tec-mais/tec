import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { Toaster } from '@/components/ui/sonner';
import { AIAgentWidget } from '@/components/ai/ai-agent-widget';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'TEC+ Acessórios',
  description: 'Tecnologia e acessórios mobile com o melhor atendimento',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster theme="dark" position="bottom-right" />
            <AIAgentWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
