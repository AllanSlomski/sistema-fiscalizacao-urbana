'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MapPin,
  Clock,
  ArrowBigUp,
  MessageSquare,
  Share2,
  User,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Occurrence } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import { useOccurrences } from '@/contexts/occurrences-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OccurrenceCardProps {
  occurrence: Occurrence;
}

export function OccurrenceCard({ occurrence }: OccurrenceCardProps) {
  const { toggleVote, hasVoted } = useOccurrences();
  const { isAuthenticated } = useAuth();
  
  const voted = hasVoted(occurrence.id);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Faça login para reportar esta ocorrência');
      return;
    }

    const result = await toggleVote(occurrence.id);
    if (result.success) {
      if (result.code === 'VOTE_ADDED') {
        toast.success('Obrigado por reportar! Isso ajuda a priorizar o problema.');
      } else {
        toast.info('Seu voto foi removido.');
      }
    } else {
      toast.error(result.message || 'Erro ao processar voto');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/ocorrencia/${occurrence.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: occurrence.title,
          text: occurrence.description || '',
          url,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência');
    }
  };

  const timeAgo = formatDistanceToNow(new Date(occurrence.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  const priorityLevel = occurrence.priority || 1;
  const isHighPriority = priorityLevel >= 4;

  return (
    <Link href={`/ocorrencia/${occurrence.id}`}>
      <Card className="group transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex">
            {/* Voting Column - Reddit Style */}
            <div className="flex flex-col items-center gap-1 border-r bg-muted/30 px-3 py-4">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 transition-colors",
                  voted 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}
                onClick={handleUpvote}
                title={voted ? "Remover voto" : "Reportar ocorrência"}
              >
                <ArrowBigUp className={cn("h-5 w-5", voted && "fill-current")} />
              </Button>
              <span className={cn("text-sm font-semibold", voted && "text-primary")}>
                {occurrence.recurrenceCount}
              </span>
              <span className="text-xs text-muted-foreground">reports</span>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-2 p-4">
              {/* Header */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="font-normal">
                  {occurrence.category?.name}
                </Badge>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {occurrence.user?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
                {isHighPriority && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Alta prioridade
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h3 className="text-balance text-lg font-semibold leading-tight group-hover:text-primary">
                {occurrence.title}
              </h3>

              {/* Description */}
              {occurrence.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {occurrence.description}
                </p>
              )}

              {/* Location */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{occurrence.address}</span>
              </div>

              {/* Footer */}
              <div className="mt-2 flex items-center justify-between border-t pt-3">
                <Badge
                  className={cn(
                    'text-white',
                    STATUS_COLORS[occurrence.currentStatus]
                  )}
                >
                  {STATUS_LABELS[occurrence.currentStatus]}
                </Badge>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs text-muted-foreground"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Comentar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs text-muted-foreground"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
