'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile) {
      if (['ADMIN', 'PROPRIETARIO', 'OPERADOR'].includes(profile.role)) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } else if (user && !profile && !authLoading) {
      setProfileError('Sua conta não tem um perfil de acesso configurado. Entre em contato com o administrador.');
    }
  }, [user, profile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProfileError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  const fillAdminCredentials = () => {
    setEmail('admin@tecmais.com');
    setPassword('AdminTecMais2026!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid">
      <Card className="w-full max-w-md glow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            <img src="/logo.svg" alt="TEC+ Acessórios" className="h-12 w-auto" />
          </div>
          <CardDescription>Entre na sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 border-primary/30 bg-primary/5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong className="text-primary">Credenciais iniciais do Admin:</strong><br />
              E-mail: admin@tecmais.com<br />
              Senha: AdminTecMais2026!
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="block mt-2 text-xs text-primary hover:underline"
              >
                Preencher automaticamente
              </button>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {profileError && (
              <Alert variant="destructive">
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Não tem conta?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
