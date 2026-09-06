'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    cpf: '',
    birth_date: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    const cpfDigits = form.cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      setError('CPF deve conter 11 dígitos');
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('Telefone deve conter DDD + número (mínimo 10 dígitos)');
      return;
    }

    setLoading(true);
    const { error } = await signUp(form);
    if (error) {
      setError(error);
    } else {
      router.push('/auth/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-grid">
      <Card className="w-full max-w-lg glow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            <img src="/logo.svg" alt="TEC+ Acessórios" className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
          <CardDescription>Preencha seus dados para se cadastrar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input id="cpf" name="cpf" value={form.cpf} onChange={handleChange} required placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento *</Label>
                <Input id="birth_date" name="birth_date" type="date" value={form.birth_date} onChange={handleChange} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp (com DDD) *</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} required placeholder="(11) 99999-9999" />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
