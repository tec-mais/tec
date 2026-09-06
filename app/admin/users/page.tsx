'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Search, Ban, CheckCircle } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setUsers(data as Profile[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateRole = async (id: string, role: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Role atualizada');
    loadData();
  };

  const toggleBan = async (user: Profile) => {
    const { error } = await supabase.from('profiles').update({ banned: !user.banned }).eq('id', user.id);
    if (error) { toast.error(error.message); return; }
    toast.success(user.banned ? 'Usuário desbanido' : 'Usuário banido');
    loadData();
  };

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Usuários</h1>
        <p className="text-sm text-muted-foreground">{users.length} usuário(s)</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar usuário..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="font-bold text-primary">{user.full_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold line-clamp-1">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                </div>
                {user.banned && <Badge variant="destructive">Banido</Badge>}
                <Select value={user.role} onValueChange={(v) => updateRole(user.id, v as UserRole)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENTE">Cliente</SelectItem>
                    <SelectItem value="OPERADOR">Operador</SelectItem>
                    <SelectItem value="PROPRIETARIO">Proprietário</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleBan(user)}
                  className={user.banned ? 'text-success' : 'text-destructive'}
                >
                  {user.banned ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
