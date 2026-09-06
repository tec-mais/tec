'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Fees } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';

export default function AdminFeesPage() {
  const [fees, setFees] = useState<Fees | null>(null);
  const [convenience, setConvenience] = useState('0');
  const [delivery, setDelivery] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('fees').select('*').maybeSingle().then(({ data }) => {
      if (data) {
        setFees(data as Fees);
        setConvenience(String(data.convenience_fee));
        setDelivery(String(data.delivery_margin));
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('fees').update({
      convenience_fee: parseFloat(convenience),
      delivery_margin: parseFloat(delivery),
      updated_at: new Date().toISOString(),
    }).eq('id', fees?.id);
    if (error) { toast.error(error.message); }
    else { toast.success('Taxas atualizadas'); }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary" /> Taxas</h1>
        <p className="text-sm text-muted-foreground">Configure as taxas aplicadas no checkout</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Configuração de Taxas</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Taxa de Conveniência (R$)</Label>
              <Input type="number" step="0.01" value={convenience} onChange={(e) => setConvenience(e.target.value)} />
              <p className="text-xs text-muted-foreground">Aplicada a todas as compras</p>
            </div>
            <div className="space-y-2">
              <Label>Margem de Entrega (R$)</Label>
              <Input type="number" step="0.01" value={delivery} onChange={(e) => setDelivery(e.target.value)} />
              <p className="text-xs text-muted-foreground">Aplicada quando a entrega é "Combinar com Vendedor"</p>
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Taxas'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
