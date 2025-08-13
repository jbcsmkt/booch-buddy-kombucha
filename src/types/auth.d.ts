export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_login?: string;
}
export interface LoginCredentials {
    username: string;
    password: string;
}
export interface CreateUserData {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user' | 'viewer';
}
export interface AuthContextType {
    user: User | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    error: string | null;
}
//# sourceMappingURL=auth.d.ts.map