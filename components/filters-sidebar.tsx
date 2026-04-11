'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { OccurrenceStatus, Category } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, STATUS_ORDER } from '@/types';
import { useOccurrences } from '@/contexts/occurrences-context';
import { cn } from '@/lib/utils';
import { X, Filter, Layers, Tag } from 'lucide-react';

interface FiltersSidebarProps {
  selectedCategory?: number;
  selectedStatus?: OccurrenceStatus;
  onCategoryChange: (categoryId?: number) => void;
  onStatusChange: (status?: OccurrenceStatus) => void;
}

export function FiltersSidebar({
  selectedCategory,
  selectedStatus,
  onCategoryChange,
  onStatusChange,
}: FiltersSidebarProps) {
  const { categories, totalCount } = useOccurrences();

  const hasFilters = selectedCategory !== undefined || selectedStatus !== undefined;

  const clearFilters = () => {
    onCategoryChange(undefined);
    onStatusChange(undefined);
  };

  return (
    <aside className="sticky top-20 space-y-4">
      {/* Active Filters */}
      {hasFilters && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Filter className="h-4 w-4" />
                Filtros ativos
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {categories.find((c) => c.id === selectedCategory)?.name}
                <button
                  onClick={() => onCategoryChange(undefined)}
                  className="ml-1 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedStatus && (
              <Badge className={cn('gap-1 text-white', STATUS_COLORS[selectedStatus])}>
                {STATUS_LABELS[selectedStatus]}
                <button
                  onClick={() => onStatusChange(undefined)}
                  className="ml-1 rounded-full hover:bg-white/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Filter */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1">
          <Button
            variant={selectedStatus === undefined ? 'secondary' : 'ghost'}
            size="sm"
            className="justify-start"
            onClick={() => onStatusChange(undefined)}
          >
            Todos
            <Badge variant="outline" className="ml-auto">
              {totalCount}
            </Badge>
          </Button>
          {STATUS_ORDER.map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'secondary' : 'ghost'}
              size="sm"
              className="justify-start"
              onClick={() => onStatusChange(status)}
            >
              <span
                className={cn(
                  'mr-2 h-2 w-2 rounded-full',
                  STATUS_COLORS[status]
                )}
              />
              {STATUS_LABELS[status]}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Category Filter */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4" />
            Categorias
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1">
          <Button
            variant={selectedCategory === undefined ? 'secondary' : 'ghost'}
            size="sm"
            className="justify-start"
            onClick={() => onCategoryChange(undefined)}
          >
            Todas
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
              size="sm"
              className="justify-start"
              onClick={() => onCategoryChange(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* About Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sobre</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            O Fiscaliza Itajaí é uma plataforma para moradores registrarem e
            acompanharem ocorrências urbanas na cidade.
          </p>
          <Separator className="my-3" />
          <p className="text-xs">
            Criado pela comunidade para a comunidade.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}
