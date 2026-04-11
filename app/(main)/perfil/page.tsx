'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Mail, Calendar, MapPin, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { useOccurrences } from '@/contexts/occurrences-context';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout, isLoading: authLoading } = useAuth();
  const { occurrences, fetchOccurrences, isLoading } = useOccurrences();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Você precisa estar logado para ver seu perfil');
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchOccurrences({ userId: user.id, perPage: 100 });
    }
  }, [user, fetchOccurrences]);

  const handleLogout = () => {
    logout();
    toast.success('Você saiu da sua conta');
    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return null;
  }

  const memberSince = format(new Date(user.createdAt), "d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  // Stats
  const stats = {
    total: occurrences.length,
    open: occurrences.filter((o) => o.currentStatus === 'ABERTO').length,
    inProgress: occurrences.filter((o) => ['EM_ANALISE', 'EM_EXECUCAO'].includes(o.currentStatus)).length,
    done: occurrences.filter((o) => o.currentStatus === 'FINALIZADO').length,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </CardDescription>
              </div>
            </div>
            {isAdmin && (
              <Badge className="gap-1">
                <Shield className="h-3 w-3" />
                Administrador
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Membro desde {memberSince}
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suas Contribuições</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-status-open">{stats.open}</p>
              <p className="text-sm text-muted-foreground">Abertas</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-status-analysis">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">Em andamento</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-status-done">{stats.done}</p>
              <p className="text-sm text-muted-foreground">Finalizadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="/minhas-ocorrencias">
              <MapPin className="mr-2 h-4 w-4" />
              Ver minhas ocorrências
            </a>
          </Button>
          
          <Separator />

          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
