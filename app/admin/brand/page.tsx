'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { StoreSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Cpu, Upload, Image as ImageIcon } from 'lucide-react';

export default function AdminBrandPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [storeName, setStoreName] = useState('TEC+ Acessórios');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from('store_settings').select('*').maybeSingle().then(({ data }) => {
      if (data) {
        setSettings(data as StoreSettings);
        setLogoUrl(data.logo_url || '');
        setStoreName(data.store_name);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('store_settings').update({
      logo_url: logoUrl || null,
      store_name: storeName,
      updated_at: new Date().toISOString(),
    }).eq('id', settings?.id);
    if (error) { toast.error(error.message); }
    else { toast.success('Marca atualizada'); }
    setSaving(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });
      if (uploadError) {
        toast.error('Erro ao enviar arquivo. Verifique se o bucket "logos" existe.');
        setUploading(false);
        return;
      }
      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
      setLogoUrl(data.publicUrl);
      toast.success('Logo enviado!');
    } catch (err: any) {
      toast.error(err.message);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Cpu className="h-6 w-6 text-primary" /> Marca & Logo</h1>
        <p className="text-sm text-muted-foreground">Logo da loja e nome exibidos no header</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Logotipo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center h-32 rounded-xl border border-border/50 bg-secondary">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-24 w-auto object-contain" />
            ) : (
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum logo enviado</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <label className="cursor-pointer flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {uploading ? 'Enviando...' : 'Enviar Logo'}
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Ou cole a URL do logo</Label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Nome da Loja</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Nome exibido quando não há logo</Label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
    </div>
  );
}
