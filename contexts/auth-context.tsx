"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import * as api from "@/lib/api";
import type {
  User,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  LoginResponse,
} from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginRequest) => Promise<ApiResponse<LoginResponse>>;
  register: (data: RegisterRequest) => Promise<ApiResponse<LoginResponse>>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "fiscaliza_auth";

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

  // Login with real API
  const login = useCallback(
    async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
      setIsLoading(true);
      try {
        if (!credentials.email || !credentials.password) {
          return {
            success: false,
            code: "VALIDATION_ERROR",
            message: "Email e senha são obrigatórios",
            data: {} as LoginResponse,
            errors: [{ field: "email", message: "Preencha todos os campos" }],
          };
        }

        // Chamar a API real
        const result = await api.login({
          email: credentials.email,
          password: credentials.password,
        });

        if (result.success && result.data.token && result.data.user) {
          // Converter o usuário da API para o formato do frontend
          const frontendUser: User = {
            id: result.data.user.id,
            name: result.data.user.name,
            email: result.data.user.email,
            role: result.data.user.role,
            createdAt: new Date().toISOString(),
          };

          saveAuth(frontendUser, result.data.token);

          return {
            success: true,
            code: "LOGIN_SUCCESS",
            message: "Login realizado com sucesso",
            data: {
              token: result.data.token,
              user: frontendUser,
            },
          };
        }

        return {
          success: false,
          code: result.code || "UNAUTHORIZED",
          message: result.message || "Email ou senha inválidos",
          data: {} as LoginResponse,
          errors: result.errors,
        };
      } catch (error) {
        console.error("[Auth] Login error:", error);
        return {
          success: false,
          code: "ERROR",
          message: "Erro ao realizar login. Tente novamente.",
          data: {} as LoginResponse,
          errors: null,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [saveAuth],
  );

  // Register with real API
  const register = useCallback(
    async (data: RegisterRequest): Promise<ApiResponse<LoginResponse>> => {
      setIsLoading(true);
      try {
        // Validação básica
        if (!data.name || !data.email || !data.password) {
          return {
            success: false,
            code: "VALIDATION_ERROR",
            message: "Todos os campos são obrigatórios",
            data: {} as LoginResponse,
            errors: [{ field: "name", message: "Preencha todos os campos" }],
          };
        }

        if (data.password.length < 6) {
          return {
            success: false,
            code: "VALIDATION_ERROR",
            message: "Senha deve ter pelo menos 6 caracteres",
            data: {} as LoginResponse,
            errors: [{ field: "password", message: "Senha muito curta" }],
          };
        }

        // Chamar a API real
        const result = await api.register({
          name: data.name,
          email: data.email,
          password: data.password,
        });

        if (result.success && result.data.token && result.data.user) {
          // Converter o usuário da API para o formato do frontend
          const frontendUser: User = {
            id: result.data.user.id,
            name: result.data.user.name,
            email: result.data.user.email,
            role: result.data.user.role,
            createdAt: new Date().toISOString(),
          };

          saveAuth(frontendUser, result.data.token);

          return {
            success: true,
            code: "USER_CREATED",
            message: "Conta criada com sucesso",
            data: {
              token: result.data.token,
              user: frontendUser,
            },
          };
        }

        return {
          success: false,
          code: result.code || "ERROR",
          message: result.message || "Erro ao criar conta",
          data: {} as LoginResponse,
          errors: result.errors,
        };
      } catch (error) {
        console.error("[Auth] Register error:", error);
        return {
          success: false,
          code: "ERROR",
          message: "Erro ao criar conta. Tente novamente.",
          data: {} as LoginResponse,
          errors: null,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [saveAuth],
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === "ADMIN",
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
