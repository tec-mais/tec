'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { BlogPost } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FileText, Eye } from 'lucide-react';
import Link from 'next/link';

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminBlogPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({ title: '', cover_image: '', content: '', tags: '', published: false });

  const loadData = useCallback(() => {
    supabase.from('blog_posts').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setPosts(data as BlogPost[]);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', cover_image: '', content: '', tags: '', published: false });
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title,
      cover_image: post.cover_image || '',
      content: post.content || '',
      tags: post.tags?.join(', ') || '',
      published: post.published,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const data = {
      title: form.title,
      slug: slugify(form.title) + '-' + Date.now().toString(36).slice(-4),
      cover_image: form.cover_image || null,
      content: form.content,
      tags,
      published: form.published,
      author_id: user?.id,
    };

    if (editing) {
      const { error } = await supabase.from('blog_posts').update({
        title: data.title, cover_image: data.cover_image, content: data.content, tags: data.tags,
        published: data.published, updated_at: new Date().toISOString(),
      }).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Artigo atualizado');
    } else {
      const { error } = await supabase.from('blog_posts').insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success('Artigo criado');
    }
    setDialogOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este artigo?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Artigo excluído');
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Blog</h1>
          <p className="text-sm text-muted-foreground">{posts.length} artigo(s)</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Novo Artigo</Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border/50 bg-card">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum artigo criado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-16 w-28 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {post.cover_image && <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-1">{post.title}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString('pt-BR')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {post.published ? <Badge className="bg-success text-white">Publicado</Badge> : <Badge variant="secondary">Rascunho</Badge>}
                    {post.tags?.slice(0, 3).map((t) => <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>)}
                  </div>
                </div>
                <div className="flex gap-2">
                  {post.published && (
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
                    </Link>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openEdit(post)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(post.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Artigo' : 'Novo Artigo'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>URL da Imagem de Capa</Label>
              <Input value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10}
                placeholder="Use # para títulos, ## para subtítulos, - para listas" />
            </div>
            <div className="space-y-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tecnologia, dicas, celular" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              <Label>Publicar artigo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
