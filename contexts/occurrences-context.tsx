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
  userVotes: Set<number>;
  notifications: Notification[];
  unreadNotificationsCount: number;
  fetchOccurrences: (params?: OccurrenceFilterParams) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createOccurrence: (data: CreateOccurrenceRequest) => Promise<ApiResponse<Occurrence>>;
  updateStatus: (id: number, status: OccurrenceStatus) => Promise<ApiResponse<Occurrence>>;
  updatePriority: (id: number, priority: number) => Promise<ApiResponse<Occurrence>>;
  deleteOccurrence: (id: number) => Promise<ApiResponse<null>>;
  getOccurrenceById: (id: number) => Promise<Occurrence | undefined>;
  setFilters: (filters: OccurrenceFilterParams) => void;
  toggleVote: (id: number) => Promise<ApiResponse<Occurrence>>;
  hasVoted: (id: number) => boolean;
  searchOccurrences: (query: string) => void;
  // Comments (mantido local por enquanto - pode ser expandido com API)
  comments: Record<number, Comment[]>;
  addComment: (occurrenceId: number, content: string) => Promise<ApiResponse<Comment>>;
  getComments: (occurrenceId: number) => Comment[];
  // Notifications
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: () => void;
  getUserOccurrences: () => Occurrence[];
}

const OccurrencesContext = createContext<OccurrencesContextType | undefined>(undefined);

// Storage key for votes (local, pois API não implementa)
const VOTES_STORAGE_KEY = 'fiscaliza_votes';

export function OccurrencesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<OccurrenceFilterParams>({});
  const [userVotes, setUserVotes] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load votes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(VOTES_STORAGE_KEY);
    if (stored) {
      try {
        const votes = JSON.parse(stored);
        setUserVotes(new Set(votes));
      } catch {
        localStorage.removeItem(VOTES_STORAGE_KEY);
      }
    }
  }, []);

  // Save votes to localStorage
  const saveVotes = useCallback((votes: Set<number>) => {
    localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify([...votes]));
  }, []);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const result = await api.getCategories();
      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('[Occurrences] Error fetching categories:', error);
    }
  }, [isAuthenticated]);

  // Fetch categories on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, fetchCategories]);

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
    async (data: CreateOccurrenceRequest): Promise<ApiResponse<Occurrence>> => {
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
        const result = await api.createOccurrence({
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          priority: 1,
          address: {
            street: data.address.street,
            number: data.address.number,
            city: data.address.city,
            state: data.address.state,
            zipcode: data.address.zipcode || '00000-000',
          },
        });

        if (result.success && result.data) {
          // Converter para formato do frontend
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
            createdAt: result.data.createdAt,
            updatedAt: result.data.updatedAt,
          };

          // Adicionar ao início da lista
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

  // Comments (local implementation - could be expanded with API)
  const getComments = useCallback((occurrenceId: number): Comment[] => {
    return comments[occurrenceId] || [];
  }, [comments]);

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

      const newComment: Comment = {
        id: Date.now(),
        occurrenceId,
        userId: user.id,
        user,
        content,
        createdAt: new Date().toISOString(),
      };

      setComments((prev) => ({
        ...prev,
        [occurrenceId]: [...(prev[occurrenceId] || []), newComment],
      }));

      return {
        success: true,
        code: 'COMMENT_ADDED',
        message: 'Comentário adicionado',
        data: newComment,
      };
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

  // Votes (local implementation)
  const hasVoted = useCallback(
    (id: number): boolean => {
      return userVotes.has(id);
    },
    [userVotes]
  );

  const toggleVote = useCallback(
    async (id: number): Promise<ApiResponse<Occurrence>> => {
      const occurrence = occurrences.find((o) => o.id === id);
      if (!occurrence) {
        return {
          success: false,
          code: 'NOT_FOUND',
          message: 'Ocorrência não encontrada',
          data: {} as Occurrence,
          errors: null,
        };
      }

      const alreadyVoted = userVotes.has(id);
      const increment = alreadyVoted ? -1 : 1;

      // Update local state
      setOccurrences((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                recurrenceCount: Math.max(0, o.recurrenceCount + increment),
              }
            : o
        )
      );

      // Toggle vote state
      setUserVotes((prev) => {
        const newVotes = new Set(prev);
        if (alreadyVoted) {
          newVotes.delete(id);
        } else {
          newVotes.add(id);
        }
        saveVotes(newVotes);
        return newVotes;
      });

      return {
        success: true,
        code: alreadyVoted ? 'VOTE_REMOVED' : 'VOTE_ADDED',
        message: alreadyVoted ? 'Voto removido' : 'Voto registrado',
        data: {
          ...occurrence,
          recurrenceCount: Math.max(0, occurrence.recurrenceCount + increment),
        },
      };
    },
    [userVotes, occurrences, saveVotes]
  );

  const value: OccurrencesContextType = {
    occurrences,
    categories,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    filters,
    userVotes,
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
    toggleVote,
    hasVoted,
    searchOccurrences,
    comments,
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
