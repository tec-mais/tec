'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AIConfig } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Sparkles, Bot, BookOpen } from 'lucide-react';

export default function AdminAIPage() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('ai_config').select('*').maybeSingle().then(({ data }) => {
      if (data) {
        setConfig(data as AIConfig);
        setSystemPrompt(data.system_prompt);
        setKnowledgeBase(data.knowledge_base || '');
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('ai_config').update({
      system_prompt: systemPrompt,
      knowledge_base: knowledgeBase,
      updated_at: new Date().toISOString(),
    }).eq('id', config?.id);
    if (error) { toast.error(error.message); }
    else { toast.success('Configuração da IA atualizada'); }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" /> Configuração da IA</h1>
        <p className="text-sm text-muted-foreground">Personalidade e base de conhecimento do assistente virtual</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" /> Personalidade do Assistente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>System Prompt (Tom de voz e comportamento)</Label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                placeholder="Ex: Você é um assistente virtual da TEC+ Acessórios. Seja prestativo, claro e objetivo..."
              />
              <p className="text-xs text-muted-foreground">Define como o assistente se comunica com a equipe</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Base de Conhecimento Interna
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Regras do negócio, FAQ e instruções operacionais</Label>
              <Textarea
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                rows={10}
                placeholder="Ex: Horário de funcionamento: Seg-Sex 9h-18h, Sáb 9h-14h. Política de troca: 7 dias. Entregas: apenas na cidade..."
              />
              <p className="text-xs text-muted-foreground">O assistente usa estas informações para responder perguntas da equipe sobre a loja</p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Configuração'}</Button>
      </form>
    </div>
  );
}
