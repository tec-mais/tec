'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { WishlistItem } from '@/lib/types';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreFooter } from '@/components/storefront/store-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ThumbsUp, Plus, Lightbulb } from 'lucide-react';

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const loadData = () => {
    supabase
      .from('wishlist_items')
      .select('*')
      .order('votes', { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data as WishlistItem[]);
      });
  };

  useEffect(() => {
    loadData();
    if (user) {
      supabase
        .from('wishlist_votes')
        .select('wishlist_item_id')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setVotedIds(new Set(data.map((v: any) => v.wishlist_item_id)));
        });
    }
  }, [user]);

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!title.trim()) return;

    const { error } = await supabase
      .from('wishlist_items')
      .insert({ user_id: user.id, title, description });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Sugestão enviada!');
      setTitle('');
      setDescription('');
      setShowForm(false);
      loadData();
    }
  };

  const handleVote = async (itemId: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (votedIds.has(itemId)) {
      toast.info('Você já votou nesta sugestão');
      return;
    }

    const { error } = await supabase.from('wishlist_votes').insert({
      wishlist_item_id: itemId,
      user_id: user.id,
    });

    if (error) {
      toast.error(error.message);
    } else {
      const newSet = new Set(votedIds);
      newSet.add(itemId);
      setVotedIds(newSet);
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, votes: i.votes + 1 } : i))
      );
      toast.success('Voto registrado!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              Sugestões da Comunidade
            </h1>
            <p className="text-sm text-muted-foreground">Sugira e vote nos acessórios que gostaria de ver na loja</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Sugestão
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Nova Sugestão</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSuggest} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Acessório *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: Capa de silicone para iPhone 15" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conte mais sobre o produto que gostaria de ver" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Enviar Sugestão</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {items.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
            <Lightbulb className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhuma sugestão ainda. Seja o primeiro!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <Badge variant="outline" className={
                      item.status === 'APPROVED' ? 'border-success text-success' :
                      item.status === 'REJECTED' ? 'border-destructive text-destructive' :
                      item.status === 'REVIEW' ? 'border-warning text-warning' : ''
                    }>
                      {item.status === 'OPEN' ? 'Aberta' : item.status === 'REVIEW' ? 'Em Análise' : item.status === 'APPROVED' ? 'Aprovada' : 'Rejeitada'}
                    </Badge>
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Button
                      variant={votedIds.has(item.id) ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleVote(item.id)}
                      disabled={votedIds.has(item.id)}
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      {votedIds.has(item.id) ? 'Votado' : 'Votar'}
                    </Button>
                    <span className="text-lg font-bold text-primary">{item.votes}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
