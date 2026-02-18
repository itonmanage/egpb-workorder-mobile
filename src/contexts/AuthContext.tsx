/**
 * Auth Context for managing user authentication state
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService } from '../services/api';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'IT_ADMIN' || user?.role === 'ENGINEER_ADMIN';

    // Check existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const result = await apiService.auth.getUser();
                if (result.success && result.data?.user) {
                    setUser(result.data.user);
                }
            } catch {
                // Not authenticated
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        try {
            const result = await apiService.auth.signIn(username, password);
            if (result.success && result.data) {
                const { user: userData, token } = result.data;
                apiService.setToken(token);
                setUser(userData);
                return { success: true };
            }
            return { success: false, error: result.error || 'Login failed' };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiService.auth.signOut();
        } finally {
            apiService.setToken(null);
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
