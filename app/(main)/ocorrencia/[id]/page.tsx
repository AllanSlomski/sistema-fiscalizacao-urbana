'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Share2,
  ArrowBigUp,
  AlertTriangle,
  CheckCircle,
  Circle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { useOccurrences } from '@/contexts/occurrences-context';
import { useAuth } from '@/contexts/auth-context';
import type { Occurrence, OccurrenceStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, STATUS_ORDER } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ id: string }>;
}

function StatusTimeline({ currentStatus }: { currentStatus: OccurrenceStatus }) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-4">
      {STATUS_ORDER.map((status, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = status === currentStatus;

        return (
          <div key={status} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2',
                isCompleted
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-muted-foreground/30 text-muted-foreground'
              )}
            >
              {isCompleted ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={cn(
                  'font-medium',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {STATUS_LABELS[status]}
              </p>
            </div>
            {isCurrent && (
              <Badge className={cn('text-white', STATUS_COLORS[status])}>
                Atual
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OccurrenceDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { getOccurrenceById, toggleVote, hasVoted, isLoading } = useOccurrences();
  const { isAuthenticated } = useAuth();
  const [occurrence, setOccurrence] = useState<Occurrence | undefined>();
  const [loading, setLoading] = useState(true);
  
  const voted = occurrence ? hasVoted(occurrence.id) : false;

  useEffect(() => {
    const fetchOccurrence = async () => {
      setLoading(true);
      try {
        const occ = await getOccurrenceById(parseInt(id));
        setOccurrence(occ);
      } catch (error) {
        console.error('[OccurrenceDetail] Error fetching:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOccurrence();
  }, [id, getOccurrenceById]);

  const handleUpvote = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para reportar esta ocorrência');
      return;
    }

    const result = await toggleVote(parseInt(id));
    if (result.success) {
      if (result.code === 'VOTE_ADDED') {
        toast.success('Obrigado por reportar! Isso ajuda a priorizar o problema.');
      } else {
        toast.info('Seu voto foi removido.');
      }
      setOccurrence(result.data);
    } else {
      toast.error(result.message || 'Erro ao processar voto');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: occurrence?.title,
          text: occurrence?.description || '',
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!occurrence) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPin className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>Ocorrência não encontrada</EmptyTitle>
            <EmptyDescription>
              A ocorrência que você está procurando não existe ou foi removida.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const priorityLevel = occurrence.priority || 1;
  const isHighPriority = priorityLevel >= 4;
  const createdDate = format(new Date(occurrence.createdAt), "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
    locale: ptBR,
  });
  const updatedDate = format(new Date(occurrence.updatedAt), "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista
        </Link>
      </Button>

      {/* Main Card */}
      <Card>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{occurrence.category?.name}</Badge>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {occurrence.user?.name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {createdDate}
            </span>
          </div>

          {/* Title */}
          <h1 className="mt-4 text-balance text-2xl font-bold">{occurrence.title}</h1>

          {/* Badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge className={cn('text-white', STATUS_COLORS[occurrence.currentStatus])}>
              {STATUS_LABELS[occurrence.currentStatus]}
            </Badge>
            {isHighPriority && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Alta prioridade
              </Badge>
            )}
          </div>

          {/* Description */}
          {occurrence.description && (
            <div className="mt-6">
              <h2 className="mb-2 font-semibold">Descrição</h2>
              <p className="text-muted-foreground">{occurrence.description}</p>
            </div>
          )}

          {/* Location */}
          <div className="mt-6">
            <h2 className="mb-2 font-semibold">Localização</h2>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{occurrence.address}</span>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant={voted ? "default" : "outline"} 
              onClick={handleUpvote} 
              disabled={isLoading}
              title={voted ? "Remover voto" : "Reportar ocorrência"}
            >
              <ArrowBigUp className={cn("mr-2 h-5 w-5", voted && "fill-current")} />
              {voted ? "Votado" : "Reportar"} ({occurrence.recurrenceCount})
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acompanhamento</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline currentStatus={occurrence.currentStatus} />

          <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p>
              <strong>Última atualização:</strong> {updatedDate}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-primary">{occurrence.recurrenceCount}</p>
              <p className="text-sm text-muted-foreground">Reportes</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-primary">{priorityLevel}</p>
              <p className="text-sm text-muted-foreground">Prioridade</p>
            </div>
            <div className="col-span-2 rounded-lg bg-muted/50 p-4 text-center sm:col-span-1">
              <p className="text-2xl font-bold text-primary">
                {STATUS_ORDER.indexOf(occurrence.currentStatus) + 1}/{STATUS_ORDER.length}
              </p>
              <p className="text-sm text-muted-foreground">Progresso</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
