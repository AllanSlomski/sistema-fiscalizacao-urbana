'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { OccurrenceCard } from '@/components/occurrence-card';
import { useOccurrences } from '@/contexts/occurrences-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export default function MyOccurrencesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { occurrences, fetchOccurrences, isLoading, getUserOccurrences } = useOccurrences();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Você precisa estar logado para ver suas ocorrências');
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user) {
      // Buscar todas as ocorrências e filtrar localmente por usuário
      fetchOccurrences({ perPage: 100 });
    }
  }, [user, fetchOccurrences]);

  // Filtrar ocorrências do usuário atual
  const myOccurrences = getUserOccurrences();

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Ocorrências</h1>
          <p className="text-muted-foreground">
            Acompanhe o status das ocorrências que você registrou
          </p>
        </div>
        <Button asChild>
          <Link href="/nova-ocorrencia">
            <Plus className="mr-2 h-4 w-4" />
            Nova Ocorrência
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : myOccurrences.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPin className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>Você ainda não registrou ocorrências</EmptyTitle>
            <EmptyDescription>
              Comece a contribuir com a comunidade registrando problemas urbanos que você identificar.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/nova-ocorrencia">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Ocorrência
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-4">
          {myOccurrences.map((occurrence) => (
            <OccurrenceCard key={occurrence.id} occurrence={occurrence} />
          ))}
        </div>
      )}
    </div>
  );
}
