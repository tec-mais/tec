'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FooterSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Footprints, Instagram, Facebook, Youtube, Twitter, MessageCircle, Music2 } from 'lucide-react';

export default function AdminFooterPage() {
  const [footer, setFooter] = useState<FooterSettings | null>(null);
  const [form, setForm] = useState({
    about_us: '', terms_of_use: '', privacy_policy: '',
    social_instagram: '', social_facebook: '', social_whatsapp: '',
    social_twitter: '', social_youtube: '', social_tiktok: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('footer_settings').select('*').maybeSingle().then(({ data }) => {
      if (data) {
        setFooter(data as FooterSettings);
        setForm({
          about_us: data.about_us || '',
          terms_of_use: data.terms_of_use || '',
          privacy_policy: data.privacy_policy || '',
          social_instagram: data.social_instagram || '',
          social_facebook: data.social_facebook || '',
          social_whatsapp: data.social_whatsapp || '',
          social_twitter: data.social_twitter || '',
          social_youtube: data.social_youtube || '',
          social_tiktok: data.social_tiktok || '',
        });
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('footer_settings').update({
      ...form,
      updated_at: new Date().toISOString(),
    }).eq('id', footer?.id);
    if (error) { toast.error(error.message); }
    else { toast.success('Rodapé atualizado'); }
    setSaving(false);
  };

  const socialFields = [
    { key: 'social_instagram', label: 'Instagram', icon: Instagram },
    { key: 'social_facebook', label: 'Facebook', icon: Facebook },
    { key: 'social_whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { key: 'social_twitter', label: 'Twitter', icon: Twitter },
    { key: 'social_youtube', label: 'YouTube', icon: Youtube },
    { key: 'social_tiktok', label: 'TikTok', icon: Music2 },
  ] as const;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Footprints className="h-6 w-6 text-primary" /> Rodapé</h1>
        <p className="text-sm text-muted-foreground">Textos institucionais e redes sociais</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Textos Institucionais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Quem Somos</Label>
              <Textarea value={form.about_us} onChange={(e) => setForm({ ...form, about_us: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Termos de Uso</Label>
              <Textarea value={form.terms_of_use} onChange={(e) => setForm({ ...form, terms_of_use: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Política de Privacidade</Label>
              <Textarea value={form.privacy_policy} onChange={(e) => setForm({ ...form, privacy_policy: e.target.value })} rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Redes Sociais</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {socialFields.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 shrink-0">
                  <field.icon className="h-5 w-5 text-primary" />
                </div>
                <Input
                  placeholder={`URL do ${field.label}`}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Rodapé'}</Button>
      </form>
    </div>
  );
}
