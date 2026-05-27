'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MapPin,
  Clock,
  MessageSquare,
  Share2,
  User,
  AlertTriangle,
  TriangleAlert,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Occurrence } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types';
import { useOccurrences } from '@/contexts/occurrences-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OccurrenceCardProps {
  occurrence: Occurrence;
}

export function OccurrenceCard({ occurrence }: OccurrenceCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

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
  const priorityLabel = PRIORITY_LABELS[priorityLevel] ?? 'Baixa';
  const priorityColor = PRIORITY_COLORS[priorityLevel] ?? 'bg-slate-500';
  const isHighPriority = priorityLevel >= 3;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  const imageUrl = occurrence.imageUrl
    ? occurrence.imageUrl.startsWith('http')
      ? occurrence.imageUrl
      : `${backendUrl}${occurrence.imageUrl}`
    : null;

  return (
    <Link href={`/ocorrencia/${occurrence.id}`}>
      <Card className="group transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="p-0">
          {imageUrl && (
            <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
              <Image
                src={imageUrl}
                alt={occurrence.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex">
            {/* Recurrence Column */}
            <div className="flex flex-col items-center justify-center gap-1 border-r bg-muted/30 px-3 py-4">
              <TriangleAlert className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">
                {occurrence.recurrenceCount}
              </span>
              <span className="text-xs text-muted-foreground">denúncias</span>
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
                <Badge className={cn('gap-1 text-white', priorityColor)}>
                  {isHighPriority && <AlertTriangle className="h-3 w-3" />}
                  {priorityLabel}
                </Badge>
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/ocorrencia/${occurrence.id}#comentarios`);
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {occurrence.commentCount ?? 0}
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
