// API Service para conexão com o backend de Fiscalização Urbana

// Base URL do backend - configurável via variável de ambiente
// Em desenvolvimento, usa o proxy do Next.js para evitar CORS
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// Chave para armazenamento do token
const TOKEN_KEY = "fiscaliza_auth";

// Interface para resposta padrão da API
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

// Helper para obter o token do localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(TOKEN_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.token;
    } catch {
      return null;
    }
  }
  return null;
}

// Helper para criar headers com autenticação
function createHeaders(includeAuth: boolean = true): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

// Função genérica para fazer requisições
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  includeAuth: boolean = true,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...createHeaders(includeAuth),
        ...options.headers,
      },
    });

    const data = await response.json();

    // A API retorna o padrão { success, code, message, data, errors, meta }
    return data as ApiResponse<T>;
  } catch (error) {
    console.error("[API] Request error:", error);
    return {
      success: false,
      code: "NETWORK_ERROR",
      message: "Erro de conexão. Verifique sua internet e tente novamente.",
      data: {} as T,
      errors: null,
    };
  }
}

// ==========================================
// Endpoints de Autenticação
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export async function login(
  credentials: LoginRequest,
): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>(
    "/auth?action=login",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    },
    false,
  );
}

export async function register(
  data: RegisterRequest,
): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>(
    "/auth?action=register",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    false,
  );
}

// ==========================================
// Endpoints de Categorias
// ==========================================

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  return apiRequest<Category[]>("/categories", {
    method: "GET",
  });
}

export async function createCategory(data: {
  name: string;
  description?: string;
}): Promise<ApiResponse<Category>> {
  return apiRequest<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: number,
  data: { name?: string; description?: string },
): Promise<ApiResponse<Category>> {
  return apiRequest<Category>(`/categories?id=${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: number): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/categories?id=${id}`, {
    method: "DELETE",
  });
}

// ==========================================
// Endpoints de Ocorrências
// ==========================================

export type OccurrenceStatus =
  | "ABERTO"
  | "EM_ANALISE"
  | "EM_EXECUCAO"
  | "FINALIZADO";

export interface OccurrenceAddress {
  street: string;
  number: string;
  city: string;
  state: string;
  zipcode: string;
}

export interface CreateOccurrenceRequest {
  title: string;
  description?: string;
  categoryId: number;
  priority?: number;
  address: OccurrenceAddress;
}

export interface UpdateOccurrenceRequest {
  title?: string;
  description?: string;
  priority?: number;
  address?: Partial<OccurrenceAddress>;
}

export interface Occurrence {
  id: number;
  title: string;
  description?: string;
  status: OccurrenceStatus;
  priority: number;
  recurrenceCount: number;
  street: string;
  number: string;
  city: string;
  state: string;
  zipcode: string;
  categoryId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export interface OccurrenceFilterParams {
  page?: number;
  perPage?: number;
  status?: OccurrenceStatus;
  categoryId?: number;
}

export async function getOccurrences(
  params?: OccurrenceFilterParams,
): Promise<ApiResponse<Occurrence[]>> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.perPage) searchParams.set("perPage", params.perPage.toString());
  if (params?.status) searchParams.set("status", params.status);
  if (params?.categoryId)
    searchParams.set("categoryId", params.categoryId.toString());

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/occurrences?${queryString}` : "/occurrences";

  return apiRequest<Occurrence[]>(endpoint, {
    method: "GET",
  });
}

export async function getOccurrenceById(
  id: number,
): Promise<ApiResponse<Occurrence>> {
  return apiRequest<Occurrence>(`/occurrences/${id}`, {
    method: "GET",
  });
}

export async function createOccurrence(
  data: CreateOccurrenceRequest,
): Promise<ApiResponse<Occurrence>> {
  return apiRequest<Occurrence>("/occurrences", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateOccurrence(
  id: number,
  data: UpdateOccurrenceRequest,
): Promise<ApiResponse<Occurrence>> {
  return apiRequest<Occurrence>(`/occurrences?id=${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function updateOccurrenceStatus(
  id: number,
  status: OccurrenceStatus,
): Promise<ApiResponse<Occurrence>> {
  return apiRequest<Occurrence>(`/occurrences?id=${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteOccurrence(id: number): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/occurrences?id=${id}`, {
    method: "DELETE",
  });
}

// ==========================================
// Exports adicionais
// ==========================================

export { getToken, API_BASE_URL };
