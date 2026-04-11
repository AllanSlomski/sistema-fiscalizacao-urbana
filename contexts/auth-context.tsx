'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, LoginRequest, RegisterRequest, ApiResponse, LoginResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginRequest) => Promise<ApiResponse<LoginResponse>>;
  register: (data: RegisterRequest) => Promise<ApiResponse<User>>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'fiscaliza_auth';

interface StoredAuth {
  user: User;
  token: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: StoredAuth = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Save auth state to localStorage
  const saveAuth = useCallback((authUser: User, authToken: string) => {
    const data: StoredAuth = { user: authUser, token: authToken };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    setUser(authUser);
    setToken(authToken);
  }, []);

  // Clear auth state
  const clearAuth = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setToken(null);
  }, []);

  // Mock login - Replace with real API call
  const login = useCallback(
    async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock validation
        if (!credentials.email || !credentials.password) {
          return {
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'Email e senha são obrigatórios',
            data: {} as LoginResponse,
            errors: [{ field: 'email', message: 'Preencha todos os campos' }],
          };
        }

        // Mock users for demo
        const mockUsers: Record<string, { user: User; password: string }> = {
          'admin@fiscaliza.com': {
            user: {
              id: 1,
              name: 'Administrador',
              email: 'admin@fiscaliza.com',
              role: 'ADMIN',
              createdAt: new Date().toISOString(),
            },
            password: 'admin123',
          },
          'usuario@teste.com': {
            user: {
              id: 2,
              name: 'Usuário Teste',
              email: 'usuario@teste.com',
              role: 'USER',
              createdAt: new Date().toISOString(),
            },
            password: '123456',
          },
        };

        const mockUser = mockUsers[credentials.email];
        if (!mockUser || mockUser.password !== credentials.password) {
          return {
            success: false,
            code: 'UNAUTHORIZED',
            message: 'Email ou senha inválidos',
            data: {} as LoginResponse,
            errors: null,
          };
        }

        const mockToken = `mock_token_${Date.now()}`;
        saveAuth(mockUser.user, mockToken);

        return {
          success: true,
          code: 'LOGIN_SUCCESS',
          message: 'Login realizado com sucesso',
          data: {
            token: mockToken,
            user: mockUser.user,
          },
        };
      } finally {
        setIsLoading(false);
      }
    },
    [saveAuth]
  );

  // Mock register - Replace with real API call
  const register = useCallback(
    async (data: RegisterRequest): Promise<ApiResponse<User>> => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock validation
        if (!data.name || !data.email || !data.password) {
          return {
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'Todos os campos são obrigatórios',
            data: {} as User,
            errors: [{ field: 'name', message: 'Preencha todos os campos' }],
          };
        }

        if (data.password.length < 6) {
          return {
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'Senha deve ter pelo menos 6 caracteres',
            data: {} as User,
            errors: [{ field: 'password', message: 'Senha muito curta' }],
          };
        }

        // Mock new user
        const newUser: User = {
          id: Date.now(),
          name: data.name,
          email: data.email,
          role: 'USER',
          createdAt: new Date().toISOString(),
        };

        const mockToken = `mock_token_${Date.now()}`;
        saveAuth(newUser, mockToken);

        return {
          success: true,
          code: 'USER_CREATED',
          message: 'Conta criada com sucesso',
          data: newUser,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [saveAuth]
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
