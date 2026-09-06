'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth, hasRole } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, X, Send, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';

export function AIAgentWidget() {
  const { profile, session } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isStaff = hasRole(profile, 'ADMIN', 'PROPRIETARIO', 'OPERADOR');

  useEffect(() => {
    if (isStaff) {
      supabase.from('ai_chat_history').select('role, content').order('created_at', { ascending: false }).limit(20).then(({ data }) => {
        if (data) {
          const reversed = data.reverse().map((m: any) => ({ role: m.role, content: m.content }));
          setHistory(reversed as ChatMessage[]);
        }
      });
    }
  }, [isStaff]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message: input,
          history: [...history, ...messages].slice(-10),
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
      setMessages([...newMessages, assistantMessage]);
      setHistory([...history, ...newMessages, assistantMessage].slice(-20));
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: `Erro: ${err.message}` }]);
    }
    setLoading(false);
  };

  if (!isStaff) return null;

  const allMessages = [...history.filter((_, i) => i >= history.length - 0), ...messages];

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg animate-pulse-glow hover:scale-110 transition-transform"
          aria-label="Abrir assistente IA"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl border border-primary/30 bg-card shadow-2xl glow-md overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Assistente Virtual</p>
                <p className="text-xs text-primary">Online</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
            {allMessages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="mx-auto h-10 w-10 text-primary/50 mb-2" />
                <p className="text-sm text-muted-foreground">Olá! Como posso ajudar?</p>
                <p className="text-xs text-muted-foreground mt-1">Posso consultar estoque, vendas e produtos.</p>
              </div>
            )}
            {allMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-2 max-w-[85%]',
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <Bot className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="rounded-lg px-3 py-2 text-sm bg-secondary">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border/50 flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="min-h-[40px] max-h-[80px] resize-none text-sm"
              rows={1}
            />
            <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
