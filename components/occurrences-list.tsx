'use client';

import { useEffect, useState } from 'react';
import { OccurrenceCard } from './occurrence-card';
import { FiltersSidebar } from './filters-sidebar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOccurrences } from '@/contexts/occurrences-context';
import type { OccurrenceStatus } from '@/types';
import { ChevronLeft, ChevronRight, MapPin, TrendingUp, Clock, Filter } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type SortOption = 'priority' | 'recent' | 'popular';

export function OccurrencesList() {
  const {
    occurrences,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    fetchOccurrences,
  } = useOccurrences();

  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<OccurrenceStatus | undefined>();
  const [sortBy, setSortBy] = useState<SortOption>('priority');

  useEffect(() => {
    fetchOccurrences({
      categoryId: selectedCategory,
      status: selectedStatus,
      page: 1,
      perPage: 10,
    });
  }, [fetchOccurrences, selectedCategory, selectedStatus]);

  const handlePageChange = (page: number) => {
    fetchOccurrences({
      categoryId: selectedCategory,
      status: selectedStatus,
      page,
      perPage: 10,
    });
  };

  const sortedOccurrences = [...occurrences].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'popular':
        return b.recurrenceCount - a.recurrenceCount;
      case 'priority':
      default:
        if (b.priority !== a.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <main className="flex-1 space-y-4">
        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {totalCount} ocorrência{totalCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-auto">
                <div className="py-4">
                  <FiltersSidebar
                    selectedCategory={selectedCategory}
                    selectedStatus={selectedStatus}
                    onCategoryChange={setSelectedCategory}
                    onStatusChange={setSelectedStatus}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Prioridade
                  </span>
                </SelectItem>
                <SelectItem value="recent">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Mais recentes
                  </span>
                </SelectItem>
                <SelectItem value="popular">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Mais reportados
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
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
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && occurrences.length === 0 && (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MapPin className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>Nenhuma ocorrência encontrada</EmptyTitle>
              <EmptyDescription>
                Não há ocorrências com os filtros selecionados. Tente alterar os filtros ou criar uma nova ocorrência.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {/* Occurrences List */}
        {!isLoading && occurrences.length > 0 && (
          <div className="space-y-4">
            {sortedOccurrences.map((occurrence) => (
              <OccurrenceCard key={occurrence.id} occurrence={occurrence} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Desktop Sidebar */}
      <aside className="hidden w-80 lg:block">
        <FiltersSidebar
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
        />
      </aside>
    </div>
  );
}
