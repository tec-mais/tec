'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreFooter } from '@/components/storefront/store-footer';
import { toast } from 'sonner';

export default function AccountPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    cpf: '',
    birth_date: '',
    phone: '',
  });

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name,
        cpf: profile.cpf || '',
        birth_date: profile.birth_date || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Senha alterada com sucesso');
      setNewPassword('');
      setConfirmPassword('');
    }
    setUpdating(false);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profileForm.full_name,
        cpf: profileForm.cpf,
        birth_date: profileForm.birth_date,
        phone: profileForm.phone,
      })
      .eq('id', user.id);
    if (error) {
      toast.error('Erro ao atualizar perfil');
    } else {
      toast.success('Perfil atualizado');
      refreshProfile();
    }
    setUpdating(false);
  };

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Minha Conta</h1>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <span className="text-lg font-bold text-primary">{profile.full_name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold">{profile.full_name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <Badge variant="outline" className="ml-auto border-primary/30 text-primary">{profile.role}</Badge>
        </div>

        <Tabs defaultValue="profile" className="max-w-2xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="password">Trocar Senha</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle className="text-lg">Dados Pessoais</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input value={profileForm.cpf} onChange={(e) => setProfileForm({ ...profileForm, cpf: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Nascimento</Label>
                      <Input type="date" value={profileForm.birth_date} onChange={(e) => setProfileForm({ ...profileForm, birth_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone / WhatsApp</Label>
                    <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                  </div>
                  <Button type="submit" disabled={updating}>Salvar Alterações</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader><CardTitle className="text-lg">Trocar Senha</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" disabled={updating}>
                    {updating ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <StoreFooter />
    </div>
  );
}
