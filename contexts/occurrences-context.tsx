'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  Occurrence,
  OccurrenceStatus,
  Category,
  CreateOccurrenceRequest,
  OccurrenceFilterParams,
  ApiResponse,
  DEFAULT_CATEGORIES,
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
  fetchOccurrences: (params?: OccurrenceFilterParams) => Promise<void>;
  createOccurrence: (data: CreateOccurrenceRequest) => Promise<ApiResponse<Occurrence>>;
  updateStatus: (id: number, status: OccurrenceStatus) => Promise<ApiResponse<Occurrence>>;
  getOccurrenceById: (id: number) => Occurrence | undefined;
  setFilters: (filters: OccurrenceFilterParams) => void;
  toggleVote: (id: number) => Promise<ApiResponse<Occurrence>>;
  hasVoted: (id: number) => boolean;
}

const OccurrencesContext = createContext<OccurrencesContextType | undefined>(undefined);

// Mock categories
const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Buracos', description: 'Buracos em vias públicas' },
  { id: 2, name: 'Iluminação', description: 'Problemas de iluminação pública' },
  { id: 3, name: 'Lixo', description: 'Acúmulo de lixo ou entulho' },
  { id: 4, name: 'Sinalização', description: 'Problemas com sinalização de trânsito' },
  { id: 5, name: 'Esgoto', description: 'Problemas com esgoto ou saneamento' },
  { id: 6, name: 'Árvores', description: 'Podas ou árvores em risco' },
  { id: 7, name: 'Calçadas', description: 'Problemas em calçadas' },
  { id: 8, name: 'Outros', description: 'Outras ocorrências' },
];

// Mock data
const MOCK_OCCURRENCES: Occurrence[] = [
  {
    id: 1,
    userId: 2,
    user: { id: 2, name: 'João Silva', email: 'joao@teste.com', role: 'USER', createdAt: '2026-01-01T00:00:00Z' },
    categoryId: 1,
    category: MOCK_CATEGORIES[0],
    title: 'Buraco grande na Avenida Brasil',
    description: 'Existe um buraco de aproximadamente 50cm de diâmetro na altura do número 500. Está causando acidentes e danos aos veículos.',
    address: 'Avenida Brasil, 500 - Centro, Itajaí - SC',
    statusId: 1,
    currentStatus: 'ABERTO',
    priority: 5,
    recurrenceCount: 12,
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 2,
    userId: 2,
    user: { id: 2, name: 'Maria Santos', email: 'maria@teste.com', role: 'USER', createdAt: '2026-01-01T00:00:00Z' },
    categoryId: 2,
    category: MOCK_CATEGORIES[1],
    title: 'Poste sem iluminação na Rua das Flores',
    description: 'O poste está apagado há mais de uma semana, deixando a rua muito escura à noite. Moradores estão preocupados com a segurança.',
    address: 'Rua das Flores, 123 - Fazenda, Itajaí - SC',
    statusId: 2,
    currentStatus: 'EM_ANALISE',
    priority: 4,
    recurrenceCount: 5,
    createdAt: '2026-04-02T14:30:00Z',
    updatedAt: '2026-04-03T09:00:00Z',
  },
  {
    id: 3,
    userId: 3,
    user: { id: 3, name: 'Pedro Costa', email: 'pedro@teste.com', role: 'USER', createdAt: '2026-01-01T00:00:00Z' },
    categoryId: 3,
    category: MOCK_CATEGORIES[2],
    title: 'Acúmulo de lixo em terreno baldio',
    description: 'Terreno baldio está sendo usado como depósito irregular de lixo. Há mau cheiro e presença de animais.',
    address: 'Rua XV de Novembro, 800 - São João, Itajaí - SC',
    statusId: 3,
    currentStatus: 'EM_EXECUCAO',
    priority: 3,
    recurrenceCount: 8,
    createdAt: '2026-04-03T08:00:00Z',
    updatedAt: '2026-04-05T11:00:00Z',
  },
  {
    id: 4,
    userId: 4,
    user: { id: 4, name: 'Ana Oliveira', email: 'ana@teste.com', role: 'USER', createdAt: '2026-01-01T00:00:00Z' },
    categoryId: 4,
    category: MOCK_CATEGORIES[3],
    title: 'Semáforo com defeito no cruzamento',
    description: 'O semáforo está piscando em amarelo continuamente. Vários quase-acidentes já ocorreram no local.',
    address: 'Rua Joinville esquina com Av. Marcos Konder - Centro, Itajaí - SC',
    statusId: 4,
    currentStatus: 'FINALIZADO',
    priority: 5,
    recurrenceCount: 15,
    createdAt: '2026-03-25T16:00:00Z',
    updatedAt: '2026-04-06T14:00:00Z',
  },
  {
    id: 5,
    userId: 5,
    user: { id: 5, name: 'Carlos Mendes', email: 'carlos@teste.com', role: 'USER', createdAt: '2026-01-01T00:00:00Z' },
    categoryId: 5,
    category: MOCK_CATEGORIES[4],
    title: 'Esgoto a céu aberto',
    description: 'Vazamento de esgoto na calçada há mais de 10 dias. Situação insalubre afetando moradores e pedestres.',
    address: 'Rua Hercílio Luz, 200 - Cidade Nova, Itajaí - SC',
    statusId: 1,
    currentStatus: 'ABERTO',
    priority: 5,
    recurrenceCount: 20,
    createdAt: '2026-04-06T07:00:00Z',
    updatedAt: '2026-04-06T07:00:00Z',
  },
  {
    id: 6,
    userId: 6,
    user: { id: 6, name: 'Lucia Ferreira', email: 'lucia@teste.com', role: 'USER', createdAt: '2026-01-01T00:00:00Z' },
    categoryId: 6,
    category: MOCK_CATEGORIES[5],
    title: 'Árvore com risco de queda',
    description: 'Árvore grande com tronco inclinado ameaçando cair sobre a rede elétrica e casas vizinhas.',
    address: 'Rua Tijucas, 450 - Dom Bosco, Itajaí - SC',
    statusId: 2,
    currentStatus: 'EM_ANALISE',
    priority: 5,
    recurrenceCount: 3,
    createdAt: '2026-04-07T09:00:00Z',
    updatedAt: '2026-04-08T10:00:00Z',
  },
];

export function OccurrencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [occurrences, setOccurrences] = useState<Occurrence[]>(MOCK_OCCURRENCES);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(MOCK_OCCURRENCES.length);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<OccurrenceFilterParams>({});
  const [userVotes, setUserVotes] = useState<Set<number>>(new Set());

  const fetchOccurrences = useCallback(async (params?: OccurrenceFilterParams) => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      let filtered = [...MOCK_OCCURRENCES];

      // Apply filters
      if (params?.categoryId) {
        filtered = filtered.filter((o) => o.categoryId === params.categoryId);
      }
      if (params?.status) {
        filtered = filtered.filter((o) => o.currentStatus === params.status);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.title.toLowerCase().includes(search) ||
            o.description?.toLowerCase().includes(search) ||
            o.address.toLowerCase().includes(search)
        );
      }
      if (params?.userId) {
        filtered = filtered.filter((o) => o.userId === params.userId);
      }

      // Sort by priority and date
      filtered.sort((a, b) => {
        if (b.priority !== a.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Pagination
      const page = params?.page || 1;
      const perPage = params?.perPage || 10;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const paginated = filtered.slice(start, end);

      setOccurrences(paginated);
      setTotalCount(filtered.length);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filtered.length / perPage));
      setFilters(params || {});
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const category = MOCK_CATEGORIES.find((c) => c.id === data.categoryId);
        const addressString = `${data.address.street}, ${data.address.number} - ${data.address.neighborhood || ''}, ${data.address.city} - ${data.address.state}`;

        const newOccurrence: Occurrence = {
          id: Date.now(),
          userId: user.id,
          user: user,
          categoryId: data.categoryId,
          category,
          title: data.title,
          description: data.description,
          address: addressString,
          statusId: 1,
          currentStatus: 'ABERTO',
          priority: 1,
          recurrenceCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        MOCK_OCCURRENCES.unshift(newOccurrence);
        setOccurrences((prev) => [newOccurrence, ...prev]);

        return {
          success: true,
          code: 'OCCURRENCE_CREATED',
          message: 'Ocorrência criada com sucesso',
          data: newOccurrence,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

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
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const index = MOCK_OCCURRENCES.findIndex((o) => o.id === id);
        if (index === -1) {
          return {
            success: false,
            code: 'NOT_FOUND',
            message: 'Ocorrência não encontrada',
            data: {} as Occurrence,
            errors: null,
          };
        }

        MOCK_OCCURRENCES[index] = {
          ...MOCK_OCCURRENCES[index],
          currentStatus: status,
          updatedAt: new Date().toISOString(),
        };

        setOccurrences((prev) =>
          prev.map((o) =>
            o.id === id
              ? { ...o, currentStatus: status, updatedAt: new Date().toISOString() }
              : o
          )
        );

        return {
          success: true,
          code: 'STATUS_UPDATED',
          message: 'Status atualizado com sucesso',
          data: MOCK_OCCURRENCES[index],
        };
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const getOccurrenceById = useCallback(
    (id: number) => {
      return MOCK_OCCURRENCES.find((o) => o.id === id);
    },
    []
  );

  const hasVoted = useCallback(
    (id: number): boolean => {
      return userVotes.has(id);
    },
    [userVotes]
  );

  const toggleVote = useCallback(
    async (id: number): Promise<ApiResponse<Occurrence>> => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const index = MOCK_OCCURRENCES.findIndex((o) => o.id === id);
        if (index === -1) {
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

        MOCK_OCCURRENCES[index] = {
          ...MOCK_OCCURRENCES[index],
          recurrenceCount: Math.max(0, MOCK_OCCURRENCES[index].recurrenceCount + increment),
        };

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
          return newVotes;
        });

        return {
          success: true,
          code: alreadyVoted ? 'VOTE_REMOVED' : 'VOTE_ADDED',
          message: alreadyVoted ? 'Voto removido' : 'Voto registrado',
          data: MOCK_OCCURRENCES[index],
        };
      } catch {
        return {
          success: false,
          code: 'ERROR',
          message: 'Erro ao processar voto',
          data: {} as Occurrence,
          errors: null,
        };
      }
    },
    [userVotes]
  );

  const value: OccurrencesContextType = {
    occurrences,
    categories: MOCK_CATEGORIES,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    filters,
    userVotes,
    fetchOccurrences,
    createOccurrence,
    updateStatus,
    getOccurrenceById,
    setFilters,
    toggleVote,
    hasVoted,
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
