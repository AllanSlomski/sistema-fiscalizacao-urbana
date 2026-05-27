"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Share2,
  AlertTriangle,
  CheckCircle,
  Circle,
  Send,
  MessageSquare,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { useOccurrences } from "@/contexts/occurrences-context";
import { useAuth } from "@/contexts/auth-context";
import * as api from "@/lib/api";
import type { Occurrence, OccurrenceStatus, Comment } from "@/types";
import { STATUS_LABELS, STATUS_COLORS, STATUS_ORDER, PRIORITY_LABELS, PRIORITY_COLORS } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

function StatusTimeline({
  currentStatus,
  isAdmin = false,
  onStatusChange,
  isUpdating = false,
}: {
  currentStatus: OccurrenceStatus;
  isAdmin?: boolean;
  onStatusChange?: (status: OccurrenceStatus) => void;
  isUpdating?: boolean;
}) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-2">
      {isAdmin && (
        <p className="mb-3 text-xs text-muted-foreground">
          Como administrador, clique em qualquer status para alterá-lo.
        </p>
      )}
      {STATUS_ORDER.map((status, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = status === currentStatus;
        const isClickable = isAdmin && !isCurrent && !isUpdating;

        return (
          <div
            key={status}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-1 transition-colors",
              isClickable && "cursor-pointer hover:bg-muted/60",
              isUpdating && "opacity-60",
            )}
            onClick={() => isClickable && onStatusChange?.(status)}
            title={isClickable ? `Alterar para "${STATUS_LABELS[status]}"` : undefined}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isCompleted
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-muted-foreground/30 text-muted-foreground",
                isClickable && "group-hover:border-primary",
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
                  "font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                  isClickable && "hover:text-foreground",
                )}
              >
                {STATUS_LABELS[status]}
              </p>
            </div>
            {isCurrent && (
              <Badge className={cn("text-white", STATUS_COLORS[status])}>
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
  const { getOccurrenceById, updateStatus, isLoading, addComment, getComments } = useOccurrences();
  const { isAuthenticated, user } = useAuth();
  const [occurrence, setOccurrence] = useState<Occurrence | undefined>();
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchOccurrence = async () => {
      setLoading(true);
      try {
        const occ = await getOccurrenceById(parseInt(id));
        setOccurrence(occ);
        if (occ) {
          const fetchedComments = await getComments(occ.id);
          setComments(fetchedComments);
        }
      } catch (error) {
        console.error("[OccurrenceDetail] Error fetching:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOccurrence();
  }, [id, getOccurrenceById, getComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !occurrence) return;

    setSubmittingComment(true);
    const result = await addComment(occurrence.id, commentText.trim());
    if (result.success && result.data) {
      setComments((prev) => [...prev, result.data as Comment]);
      setCommentText('');
    } else {
      toast.error(result.message || 'Erro ao adicionar comentário');
    }
    setSubmittingComment(false);
  };

  const handleStatusChange = async (newStatus: OccurrenceStatus) => {
    if (!occurrence) return;
    setUpdatingStatus(true);
    const result = await updateStatus(occurrence.id, newStatus);
    if (result.success) {
      setOccurrence((prev) => prev ? { ...prev, currentStatus: newStatus } : prev);
      toast.success(`Status alterado para "${STATUS_LABELS[newStatus]}"`);
    } else {
      toast.error(result.message || "Erro ao atualizar status");
    }
    setUpdatingStatus(false);
  };

  const handleNotifyGovernment = async () => {
    if (!occurrence) return;
    setNotifying(true);
    const result = await api.notifyGovernment(occurrence.id);
    if (result.success) {
      toast.success("Ocorrência enviada ao governo com sucesso!");
    } else {
      toast.error(result.message || "Erro ao notificar o governo");
    }
    setNotifying(false);
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: occurrence?.title,
          text: occurrence?.description || "",
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência");
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
  const priorityLabel = PRIORITY_LABELS[priorityLevel] ?? 'Baixa';
  const priorityColor = PRIORITY_COLORS[priorityLevel] ?? 'bg-slate-500';
  const isHighPriority = priorityLevel >= 3;
  const createdDate = format(
    new Date(occurrence.createdAt),
    "d 'de' MMMM 'de' yyyy 'às' HH:mm",
    {
      locale: ptBR,
    },
  );
  const updatedDate = format(
    new Date(occurrence.updatedAt),
    "d 'de' MMMM 'de' yyyy 'às' HH:mm",
    {
      locale: ptBR,
    },
  );

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
          <h1 className="mt-4 text-balance text-2xl font-bold">
            {occurrence.title}
          </h1>

          {/* Badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "text-white",
                STATUS_COLORS[occurrence.currentStatus],
              )}
            >
              {STATUS_LABELS[occurrence.currentStatus]}
            </Badge>
            <Badge className={cn("gap-1 text-white", priorityColor)}>
              {isHighPriority && <AlertTriangle className="h-3 w-3" />}
              {priorityLabel}
            </Badge>
          </div>

          {/* Image */}
          {occurrence.imageUrl && (
            <div className="relative mt-6 overflow-hidden rounded-lg">
              <Image
                src={
                  occurrence.imageUrl.startsWith('http')
                    ? occurrence.imageUrl
                    : `${backendUrl}${occurrence.imageUrl}`
                }
                alt={occurrence.title}
                width={800}
                height={400}
                className="w-full rounded-lg object-cover"
              />
            </div>
          )}

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
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
              <TriangleAlert className="h-4 w-4" />
              <span><strong>{occurrence.recurrenceCount}</strong> denúncia(s) registrada(s)</span>
            </div>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
            <Button
              variant="outline"
              onClick={handleNotifyGovernment}
              disabled={notifying}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", notifying && "animate-spin")} />
              Atualizar Ocorrência
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
          <StatusTimeline
            currentStatus={occurrence.currentStatus}
            isAdmin={user?.role === 'ADMIN'}
            onStatusChange={handleStatusChange}
            isUpdating={updatingStatus}
          />

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
              <p className="text-2xl font-bold text-primary">
                {occurrence.recurrenceCount}
              </p>
              <p className="text-sm text-muted-foreground">Reportes</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className={cn("text-xl font-bold text-white rounded px-2 py-1 inline-block", priorityColor)}>
                {priorityLabel}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Prioridade</p>
            </div>
            <div className="col-span-2 rounded-lg bg-muted/50 p-4 text-center sm:col-span-1">
              <p className="text-2xl font-bold text-primary">
                {STATUS_ORDER.indexOf(occurrence.currentStatus) + 1}/
                {STATUS_ORDER.length}
              </p>
              <p className="text-sm text-muted-foreground">Progresso</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Card */}
      <Card id="comentarios">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Comentários ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum comentário ainda. Seja o primeiro a comentar.
            </p>
          )}

          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {comment.user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 rounded-lg bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {comment.user?.name ?? 'Usuário'}
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm">{comment.content}</p>
              </div>
            </div>
          ))}

          {isAuthenticated && (
            <form onSubmit={handleSubmitComment} className="flex gap-2 pt-2">
              <Textarea
                placeholder="Escreva um comentário..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                className="flex-1 resize-none"
                disabled={submittingComment}
              />
              <Button
                type="submit"
                size="icon"
                className="self-end"
                disabled={submittingComment || !commentText.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}

          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="text-primary underline">
                Faça login
              </Link>{' '}
              para comentar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
