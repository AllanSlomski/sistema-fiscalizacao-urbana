'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MapPin,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  ChevronRight,
  Settings,
  BarChart3,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useOccurrences } from '@/contexts/occurrences-context';
import { useAuth } from '@/contexts/auth-context';
import type { OccurrenceStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, STATUS_ORDER } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { occurrences, fetchOccurrences, updateStatus, isLoading, totalCount } = useOccurrences();
  const [selectedStatuses, setSelectedStatuses] = useState<Record<number, OccurrenceStatus>>({});

  useEffect(() => {
    // Redirect non-admin users
    if (!authLoading && (!user || !isAdmin)) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      router.push('/');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    fetchOccurrences({ perPage: 50 });
  }, [fetchOccurrences]);

  const handleStatusChange = (occurrenceId: number, status: OccurrenceStatus) => {
    setSelectedStatuses((prev) => ({ ...prev, [occurrenceId]: status }));
  };

  const handleUpdateStatus = async (occurrenceId: number) => {
    const newStatus = selectedStatuses[occurrenceId];
    if (!newStatus) return;

    const result = await updateStatus(occurrenceId, newStatus);
    if (result.success) {
      toast.success('Status atualizado com sucesso!');
      setSelectedStatuses((prev) => {
        const newState = { ...prev };
        delete newState[occurrenceId];
        return newState;
      });
    } else {
      toast.error(result.message || 'Erro ao atualizar status');
    }
  };

  // Stats
  const stats = {
    total: occurrences.length,
    open: occurrences.filter((o) => o.currentStatus === 'ABERTO').length,
    inProgress: occurrences.filter((o) => ['EM_ANALISE', 'EM_EXECUCAO'].includes(o.currentStatus)).length,
    done: occurrences.filter((o) => o.currentStatus === 'FINALIZADO').length,
    highPriority: occurrences.filter((o) => (o.priority || 0) >= 4).length,
  };

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie as ocorrências e atualize status
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchOccurrences({ perPage: 50 })}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              ocorrências registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Abertas</CardTitle>
            <Clock className="h-4 w-4 text-status-open" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">
              aguardando análise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Settings className="h-4 w-4 text-status-analysis" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              sendo tratadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-status-done" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.done}</div>
            <p className="text-xs text-muted-foreground">
              resolvidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highPriority}</div>
            <p className="text-xs text-muted-foreground">
              requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Occurrences Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Ocorrências</CardTitle>
          <CardDescription>
            Atualize o status das ocorrências conforme o andamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : occurrences.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MapPin className="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle>Nenhuma ocorrência</EmptyTitle>
                <EmptyDescription>
                  Não há ocorrências registradas no sistema.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Ocorrência</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status Atual</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Alterar Status</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {occurrences.map((occurrence) => {
                    const isHighPriority = (occurrence.priority || 0) >= 4;
                    const pendingStatus = selectedStatuses[occurrence.id];

                    return (
                      <TableRow key={occurrence.id}>
                        <TableCell className="font-medium">
                          {occurrence.id}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="truncate font-medium">
                              {occurrence.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {occurrence.address}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {occurrence.category?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              'text-white',
                              STATUS_COLORS[occurrence.currentStatus]
                            )}
                          >
                            {STATUS_LABELS[occurrence.currentStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {occurrence.priority || 1}
                            </span>
                            {isHighPriority && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={pendingStatus || ''}
                              onValueChange={(v) =>
                                handleStatusChange(occurrence.id, v as OccurrenceStatus)
                              }
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue placeholder="Novo status" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_ORDER.map((status) => (
                                  <SelectItem
                                    key={status}
                                    value={status}
                                    disabled={status === occurrence.currentStatus}
                                  >
                                    {STATUS_LABELS[status]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {pendingStatus && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(occurrence.id)}
                                disabled={isLoading}
                              >
                                Salvar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/ocorrencia/${occurrence.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
