// Status Enum
export type OccurrenceStatus = 'ABERTO' | 'EM_ANALISE' | 'EM_EXECUCAO' | 'FINALIZADO';

// User Role
export type UserRole = 'USER' | 'ADMIN';

// Address
export interface Address {
  street: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipcode: string;
}

// User
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

// Category
export interface Category {
  id: number;
  name: string;
  description?: string;
}

// Status
export interface Status {
  id: number;
  name: OccurrenceStatus;
  orderIndex: number;
}

// Occurrence
export interface Occurrence {
  id: number;
  userId: number;
  user?: User;
  categoryId: number;
  category?: Category;
  title: string;
  description?: string;
  address: string;
  statusId: number;
  status?: Status;
  currentStatus: OccurrenceStatus;
  priority?: number;
  recurrenceCount: number;
  createdAt: string;
  updatedAt: string;
}

// Occurrence Status History
export interface OccurrenceStatusHistory {
  id: number;
  occurrenceId: number;
  statusId: number;
  status?: Status;
  changedBy?: number;
  source?: string;
  createdAt: string;
}

// Comment
export interface Comment {
  id: number;
  occurrenceId: number;
  userId: number;
  user?: User;
  content: string;
  createdAt: string;
}

// Notification
export interface Notification {
  id: number;
  userId: number;
  occurrenceId?: number;
  occurrence?: Occurrence;
  message: string;
  read: boolean;
  createdAt: string;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  code: string;
  message?: string;
  data: T;
  errors?: Array<{
    field: string;
    message: string;
  }> | null;
  meta?: {
    timestamp: string;
    path: string;
    requestId: string;
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  };
}

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
}

// Login Response
export interface LoginResponse {
  token: string;
  user: User;
}

// Register Request
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Create Occurrence Request
export interface CreateOccurrenceRequest {
  title: string;
  description?: string;
  categoryId: number;
  address: Address;
}

// Update Status Request
export interface UpdateStatusRequest {
  status: OccurrenceStatus;
}

// Pagination
export interface PaginationParams {
  page?: number;
  perPage?: number;
}

// Filter Params
export interface OccurrenceFilterParams extends PaginationParams {
  categoryId?: number;
  status?: OccurrenceStatus;
  search?: string;
  userId?: number;
}

// Status Labels
export const STATUS_LABELS: Record<OccurrenceStatus, string> = {
  ABERTO: 'Aberto',
  EM_ANALISE: 'Em Análise',
  EM_EXECUCAO: 'Em Execução',
  FINALIZADO: 'Finalizado',
};

// Status Colors
export const STATUS_COLORS: Record<OccurrenceStatus, string> = {
  ABERTO: 'bg-status-open',
  EM_ANALISE: 'bg-status-analysis',
  EM_EXECUCAO: 'bg-status-execution',
  FINALIZADO: 'bg-status-done',
};

// Status Order
export const STATUS_ORDER: OccurrenceStatus[] = [
  'ABERTO',
  'EM_ANALISE',
  'EM_EXECUCAO',
  'FINALIZADO',
];

// Default Categories
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Buracos', description: 'Buracos em vias públicas' },
  { id: 2, name: 'Iluminação', description: 'Problemas de iluminação pública' },
  { id: 3, name: 'Lixo', description: 'Acúmulo de lixo ou entulho' },
  { id: 4, name: 'Sinalização', description: 'Problemas com sinalização de trânsito' },
  { id: 5, name: 'Esgoto', description: 'Problemas com esgoto ou saneamento' },
  { id: 6, name: 'Árvores', description: 'Podas ou árvores em risco' },
  { id: 7, name: 'Calçadas', description: 'Problemas em calçadas' },
  { id: 8, name: 'Outros', description: 'Outras ocorrências' },
];
