/**
 * Auth Context for managing user authentication state
 * - Persists login session via AsyncStorage
 * - Auto-logout after 2 days of inactivity
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiService } from '../services/api';
import { User } from '../types';

// Storage keys
const STORAGE_KEYS = {
    TOKEN: 'auth_token',
    USER: 'auth_user',
    LAST_ACTIVE: 'last_active_timestamp',
};

// 2 days in milliseconds
const SESSION_TIMEOUT_MS = 2 * 24 * 60 * 60 * 1000;

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
    const appState = useRef(AppState.currentState);

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'IT_ADMIN' || user?.role === 'ENGINEER_ADMIN';

    // ---- Setup Global 401 Interceptor ----
    useEffect(() => {
        apiService.setOnUnauthorized(() => {
            clearStoredAuth().then(() => {
                apiService.setToken(null);
                setUser(null);
            });
        });
    }, []);

    // ---- Update last active timestamp ----
    const updateLastActive = useCallback(async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
        } catch {
            // ignore storage errors
        }
    }, []);

    // ---- Check if session has expired (2 days inactivity) ----
    const isSessionExpired = useCallback(async (): Promise<boolean> => {
        try {
            const lastActive = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
            if (!lastActive) return false;

            const elapsed = Date.now() - parseInt(lastActive, 10);
            return elapsed > SESSION_TIMEOUT_MS;
        } catch {
            return false;
        }
    }, []);

    // ---- Clear all stored auth data ----
    const clearStoredAuth = useCallback(async () => {
        try {
            await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.USER,
                STORAGE_KEYS.LAST_ACTIVE,
            ]);
        } catch {
            // ignore
        }
    }, []);

    // ---- Restore session on mount ----
    useEffect(() => {
        const restoreSession = async () => {
            try {
                // Check if session expired
                const expired = await isSessionExpired();
                if (expired) {
                    await clearStoredAuth();
                    apiService.setToken(null);
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                // Try to restore saved token
                const savedToken = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
                if (savedToken) {
                    apiService.setToken(savedToken);

                    // Verify token is still valid with server
                    const result = await apiService.auth.getUser();
                    if (result.success && result.data?.user) {
                        setUser(result.data.user);
                        // Save fresh user data
                        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.data.user));
                        await updateLastActive();
                    } else {
                        await clearStoredAuth();
                        apiService.setToken(null);
                    }
                }
            } catch (error) {
                console.error('Session restore error:', error);
                await clearStoredAuth();
                apiService.setToken(null);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, [isSessionExpired, clearStoredAuth, updateLastActive]);

    // ---- Track app state changes to update last active & check expiry ----
    useEffect(() => {
        const handleAppStateChange = async (nextState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextState === 'active') {
                // App came to foreground — check session expiry
                if (user) {
                    const expired = await isSessionExpired();
                    if (expired) {
                        await clearStoredAuth();
                        apiService.setToken(null);
                        setUser(null);
                        return;
                    }
                    // Session still valid — update last active
                    await updateLastActive();
                }
            } else if (nextState.match(/inactive|background/)) {
                // App going to background — save last active time
                if (user) {
                    await updateLastActive();
                }
            }
            appState.current = nextState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [user, isSessionExpired, clearStoredAuth, updateLastActive]);

    // ---- Login ----
    const login = useCallback(async (username: string, password: string) => {
        try {
            const result = await apiService.auth.signIn(username, password);
            if (result.success && result.data) {
                const { user: userData, token } = result.data;

                // Set token in API service
                apiService.setToken(token);
                setUser(userData);

                // Persist to Storage
                await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
                await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
                await updateLastActive();

                return { success: true };
            }
            return { success: false, error: result.error || 'Login failed' };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }, [updateLastActive]);

    // ---- Logout ----
    const logout = useCallback(async () => {
        try {
            await apiService.auth.signOut();
        } finally {
            apiService.setToken(null);
            setUser(null);
            await clearStoredAuth();
        }
    }, [clearStoredAuth]);

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
