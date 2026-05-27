'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import * as api from '@/lib/api';
import type { ApiComment } from '@/lib/api';
import type {
  Occurrence,
  OccurrenceStatus,
  Category,
  CreateOccurrenceRequest,
  OccurrenceFilterParams,
  ApiResponse,
  Comment,
  Notification,
} from '@/types';
import { useAuth } from './auth-context';

interface OccurrencesContextType {
  occurrences: Occurrence[];
  categories: Category[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: OccurrenceFilterParams;
  notifications: Notification[];
  unreadNotificationsCount: number;
  fetchOccurrences: (params?: OccurrenceFilterParams) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createOccurrence: (data: CreateOccurrenceRequest, imageFile?: File) => Promise<ApiResponse<Occurrence>>;
  updateStatus: (id: number, status: OccurrenceStatus) => Promise<ApiResponse<Occurrence>>;
  updatePriority: (id: number, priority: number) => Promise<ApiResponse<Occurrence>>;
  deleteOccurrence: (id: number) => Promise<ApiResponse<null>>;
  getOccurrenceById: (id: number) => Promise<Occurrence | undefined>;
  setFilters: (filters: OccurrenceFilterParams) => void;
  reportRecurrence: (id: number) => Promise<ApiResponse<{ recurrenceCount: number }>>;
  searchOccurrences: (query: string) => void;
  addComment: (occurrenceId: number, content: string) => Promise<ApiResponse<Comment>>;
  getComments: (occurrenceId: number) => Promise<Comment[]>;
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: () => void;
  getUserOccurrences: () => Occurrence[];
}

const OccurrencesContext = createContext<OccurrencesContextType | undefined>(undefined);

// Storage key for votes (local, pois API não implementa)
export function OccurrencesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<OccurrenceFilterParams>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      const result = await api.getCategories();
      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('[Occurrences] Error fetching categories:', error);
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch occurrences from API
  const fetchOccurrences = useCallback(async (params?: OccurrenceFilterParams) => {
    setIsLoading(true);
    try {
      const result = await api.getOccurrences({
        page: params?.page || 1,
        perPage: params?.perPage || 10,
        status: params?.status,
        categoryId: params?.categoryId,
      });

      if (result.success && Array.isArray(result.data)) {
        // Converter formato da API para formato do frontend
        const frontendOccurrences: Occurrence[] = result.data.map((occ) => ({
          id: occ.id,
          userId: occ.userId,
          user: occ.user ? {
            id: occ.user.id,
            name: occ.user.name,
            email: occ.user.email,
            role: 'USER' as const,
            createdAt: new Date().toISOString(),
          } : undefined,
          categoryId: occ.categoryId,
          category: occ.category ? {
            id: occ.category.id,
            name: occ.category.name,
          } : undefined,
          title: occ.title,
          description: occ.description,
          address: `${occ.street}, ${occ.number} - ${occ.city}, ${occ.state}`,
          statusId: 1,
          currentStatus: occ.status,
          priority: occ.priority || 1,
          recurrenceCount: occ.recurrenceCount || 1,
          commentCount: occ._count?.comments ?? 0,
          imageUrl: occ.imageUrl,
          createdAt: occ.createdAt,
          updatedAt: occ.updatedAt,
        }));

        setOccurrences(frontendOccurrences);
        setTotalCount(result.meta?.total || frontendOccurrences.length);
        setCurrentPage(result.meta?.page || 1);
        setTotalPages(result.meta?.totalPages || 1);
        setFilters(params || {});
      } else {
        setOccurrences([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('[Occurrences] Error fetching:', error);
      setOccurrences([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create occurrence via API
  const createOccurrence = useCallback(
    async (data: CreateOccurrenceRequest, imageFile?: File): Promise<ApiResponse<Occurrence>> => {
      if (!user) {
        return {
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Você precisa estar logado para criar uma ocorrência',
          data: {} as Occurrence,
          errors: null,
        };
      }

      setIsLoading(true);
      try {
        let imageUrl: string | undefined;

        if (imageFile) {
          const uploadResult = await api.uploadImage(imageFile);
          if (uploadResult.success && uploadResult.data?.imageUrl) {
            imageUrl = uploadResult.data.imageUrl;
          } else {
            return {
              success: false,
              code: 'UPLOAD_ERROR',
              message: uploadResult.message || 'Erro ao fazer upload da imagem',
              data: {} as Occurrence,
              errors: null,
            };
          }
        }

        const result = await api.createOccurrence({
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          priority: 1,
          imageUrl,
          address: {
            street: data.address.street,
            number: data.address.number,
            city: data.address.city,
            state: data.address.state,
            zipcode: data.address.zipcode || '00000-000',
          },
        });

        // Duplicata detectada — repassar diretamente para a página tratar
        if (result.code === 'OCCURRENCE_ALREADY_EXISTS') {
          return {
            success: false,
            code: 'OCCURRENCE_ALREADY_EXISTS',
            message: result.message || 'Ocorrência já registrada neste local.',
            data: result.data as unknown as Occurrence,
            errors: null,
          };
        }

        if (result.success && result.data) {
          const newOccurrence: Occurrence = {
            id: result.data.id,
            userId: user.id,
            user: user,
            categoryId: data.categoryId,
            category: categories.find((c) => c.id === data.categoryId),
            title: result.data.title,
            description: data.description,
            address: `${data.address.street}, ${data.address.number} - ${data.address.city}, ${data.address.state}`,
            statusId: 1,
            currentStatus: 'ABERTO',
            priority: result.data.priority || 1,
            recurrenceCount: result.data.recurrenceCount || 1,
            imageUrl: result.data.imageUrl,
            createdAt: result.data.createdAt,
            updatedAt: result.data.updatedAt,
          };

          setOccurrences((prev) => [newOccurrence, ...prev]);
          setTotalCount((prev) => prev + 1);

          return {
            success: true,
            code: 'OCCURRENCE_CREATED',
            message: 'Ocorrência criada com sucesso',
            data: newOccurrence,
          };
        }

        return {
          success: false,
          code: result.code || 'ERROR',
          message: result.message || 'Erro ao criar ocorrência',
          data: {} as Occurrence,
          errors: result.errors,
        };
      } catch (error) {
        console.error('[Occurrences] Error creating:', error);
        return {
          success: false,
          code: 'ERROR',
          message: 'Erro ao criar ocorrência',
          data: {} as Occurrence,
          errors: null,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [user, categories]
  );

  // Update status via API
  const updateStatus = useCallback(
    async (id: number, status: OccurrenceStatus): Promise<ApiResponse<Occurrence>> => {
      if (!user || user.role !== 'ADMIN') {
        return {
          success: false,
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem alterar o status',
          data: {} as Occurrence,
          errors: null,
        };
      }

      setIsLoading(true);
      try {
        const result = await api.updateOccurrenceStatus(id, status);

        if (result.success && result.data) {
          // Atualizar na lista local
          setOccurrences((prev) =>
            prev.map((o) =>
              o.id === id
                ? { ...o, currentStatus: status, updatedAt: new Date().toISOString() }
                : o
            )
          );

          const updatedOccurrence = occurrences.find((o) => o.id === id);
          return {
            success: true,
            code: 'STATUS_UPDATED',
            message: 'Status atualizado com sucesso',
            data: updatedOccurrence ? { ...updatedOccurrence, currentStatus: status } : ({} as Occurrence),
          };
        }

        return {
          success: false,
          code: result.code || 'ERROR',
          message: result.message || 'Erro ao atualizar status',
          data: {} as Occurrence,
          errors: result.errors,
        };
      } catch (error) {
        console.error('[Occurrences] Error updating status:', error);
        return {
          success: false,
          code: 'ERROR',
          message: 'Erro ao atualizar status',
          data: {} as Occurrence,
          errors: null,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [user, occurrences]
  );

  // Get occurrence by ID via API
  const getOccurrenceById = useCallback(
    async (id: number): Promise<Occurrence | undefined> => {
      // First check local cache
      const cached = occurrences.find((o) => o.id === id);
      if (cached) return cached;

      // Otherwise fetch from API
      try {
        const result = await api.getOccurrenceById(id);
        if (result.success && result.data) {
          const occ = result.data;
          return {
            id: occ.id,
            userId: occ.userId,
            user: occ.user ? {
              id: occ.user.id,
              name: occ.user.name,
              email: occ.user.email,
              role: 'USER' as const,
              createdAt: new Date().toISOString(),
            } : undefined,
            categoryId: occ.categoryId,
            category: occ.category,
            title: occ.title,
            description: occ.description,
            address: `${occ.street}, ${occ.number} - ${occ.city}, ${occ.state}`,
            statusId: 1,
            currentStatus: occ.status,
            priority: occ.priority || 1,
            recurrenceCount: occ.recurrenceCount || 1,
            commentCount: occ._count?.comments ?? 0,
            imageUrl: occ.imageUrl,
            createdAt: occ.createdAt,
            updatedAt: occ.updatedAt,
          };
        }
      } catch (error) {
        console.error('[Occurrences] Error fetching by ID:', error);
      }
      return undefined;
    },
    [occurrences]
  );

  // Update priority via API
  const updatePriority = useCallback(
    async (id: number, priority: number): Promise<ApiResponse<Occurrence>> => {
      if (!user || user.role !== 'ADMIN') {
        return {
          success: false,
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem alterar a prioridade',
          data: {} as Occurrence,
          errors: null,
        };
      }

      setIsLoading(true);
      try {
        const result = await api.updateOccurrence(id, { priority });

        if (result.success) {
          setOccurrences((prev) =>
            prev.map((o) =>
              o.id === id
                ? { ...o, priority, updatedAt: new Date().toISOString() }
                : o
            )
          );

          const updatedOccurrence = occurrences.find((o) => o.id === id);
          return {
            success: true,
            code: 'PRIORITY_UPDATED',
            message: 'Prioridade atualizada com sucesso',
            data: updatedOccurrence ? { ...updatedOccurrence, priority } : ({} as Occurrence),
          };
        }

        return {
          success: false,
          code: result.code || 'ERROR',
          message: result.message || 'Erro ao atualizar prioridade',
          data: {} as Occurrence,
          errors: result.errors,
        };
      } catch (error) {
        console.error('[Occurrences] Error updating priority:', error);
        return {
          success: false,
          code: 'ERROR',
          message: 'Erro ao atualizar prioridade',
          data: {} as Occurrence,
          errors: null,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [user, occurrences]
  );

  // Delete occurrence via API
  const deleteOccurrence = useCallback(
    async (id: number): Promise<ApiResponse<null>> => {
      if (!user || user.role !== 'ADMIN') {
        return {
          success: false,
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem excluir ocorrências',
          data: null,
          errors: null,
        };
      }

      setIsLoading(true);
      try {
        const result = await api.deleteOccurrence(id);

        if (result.success) {
          setOccurrences((prev) => prev.filter((o) => o.id !== id));
          setTotalCount((prev) => prev - 1);

          return {
            success: true,
            code: 'OCCURRENCE_DELETED',
            message: 'Ocorrência excluída com sucesso',
            data: null,
          };
        }

        return {
          success: false,
          code: result.code || 'ERROR',
          message: result.message || 'Erro ao excluir ocorrência',
          data: null,
          errors: result.errors,
        };
      } catch (error) {
        console.error('[Occurrences] Error deleting:', error);
        return {
          success: false,
          code: 'ERROR',
          message: 'Erro ao excluir ocorrência',
          data: null,
          errors: null,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const searchOccurrences = useCallback((query: string) => {
    // Filter locally for now (backend search could be added)
    if (!query.trim()) {
      fetchOccurrences();
      return;
    }

    const filtered = occurrences.filter(
      (o) =>
        o.title.toLowerCase().includes(query.toLowerCase()) ||
        o.description?.toLowerCase().includes(query.toLowerCase()) ||
        o.address.toLowerCase().includes(query.toLowerCase())
    );
    setOccurrences(filtered);
    setTotalCount(filtered.length);
  }, [fetchOccurrences, occurrences]);

  const getUserOccurrences = useCallback(() => {
    if (!user) return [];
    return occurrences.filter((o) => o.userId === user.id);
  }, [user, occurrences]);

  const getComments = useCallback(async (occurrenceId: number): Promise<Comment[]> => {
    try {
      const result = await api.getComments(occurrenceId);
      if (result.success && Array.isArray(result.data)) {
        return result.data.map((c: ApiComment) => ({
          id: c.id,
          occurrenceId: c.occurrenceId,
          userId: c.userId,
          user: c.user ? {
            id: c.user.id,
            name: c.user.name,
            email: c.user.email,
            role: 'USER' as const,
            createdAt: new Date().toISOString(),
          } : undefined,
          content: c.content,
          createdAt: c.createdAt,
        }));
      }
    } catch (error) {
      console.error('[Occurrences] Error fetching comments:', error);
    }
    return [];
  }, []);

  const addComment = useCallback(
    async (occurrenceId: number, content: string): Promise<ApiResponse<Comment>> => {
      if (!user) {
        return {
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Você precisa estar logado para comentar',
          data: {} as Comment,
          errors: null,
        };
      }

      try {
        const result = await api.createComment({ occurrenceId, content });

        if (result.success && result.data) {
          const c = result.data;
          const newComment: Comment = {
            id: c.id,
            occurrenceId: c.occurrenceId,
            userId: c.userId,
            user: c.user ? {
              id: c.user.id,
              name: c.user.name,
              email: c.user.email,
              role: 'USER' as const,
              createdAt: new Date().toISOString(),
            } : undefined,
            content: c.content,
            createdAt: c.createdAt,
          };

          return {
            success: true,
            code: 'COMMENT_ADDED',
            message: 'Comentário adicionado',
            data: newComment,
          };
        }

        return {
          success: false,
          code: result.code || 'ERROR',
          message: result.message || 'Erro ao adicionar comentário',
          data: {} as Comment,
          errors: result.errors,
        };
      } catch (error) {
        console.error('[Occurrences] Error adding comment:', error);
        return {
          success: false,
          code: 'ERROR',
          message: 'Erro ao adicionar comentário',
          data: {} as Comment,
          errors: null,
        };
      }
    },
    [user]
  );

  // Notifications
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const markNotificationAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const reportRecurrence = useCallback(
    async (id: number): Promise<ApiResponse<{ recurrenceCount: number }>> => {
      const result = await api.reportRecurrence(id);
      if (result.success && result.data?.recurrenceCount !== undefined) {
        setOccurrences((prev) =>
          prev.map((o) =>
            o.id === id ? { ...o, recurrenceCount: result.data!.recurrenceCount } : o
          )
        );
      }
      return result;
    },
    [occurrences]
  );

  const value: OccurrencesContextType = {
    occurrences,
    categories,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    filters,
    notifications,
    unreadNotificationsCount,
    fetchOccurrences,
    fetchCategories,
    createOccurrence,
    updateStatus,
    updatePriority,
    deleteOccurrence,
    getOccurrenceById,
    setFilters,
    reportRecurrence,
    searchOccurrences,
    addComment,
    getComments,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUserOccurrences,
  };

  return (
    <OccurrencesContext.Provider value={value}>
      {children}
    </OccurrencesContext.Provider>
  );
}

export function useOccurrences() {
  const context = useContext(OccurrencesContext);
  if (context === undefined) {
    throw new Error('useOccurrences must be used within an OccurrencesProvider');
  }
  return context;
}
