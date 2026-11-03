import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api/endpoints";
import {
    clearTokens, getStoredRefreshToken, refreshSession, setSessionLostHandler, storeTokens,
} from "../api/http";
import type { UserProfile } from "../api/types";

type AuthStatus = "loading" | "anonymous" | "authenticated";

interface AuthContextValue {
    status: AuthStatus;
    user: UserProfile | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Mantiene la sesión del usuario: la recupera al cargar la página y expone login, registro y logout.
export function AuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>("loading");
    const [user, setUserState] = useState<UserProfile | null>(null);

    const endSession = useCallback(() => {
        clearTokens();
        setUserState(null);
        setStatus("anonymous");
    }, []);

    useEffect(() => {
        setSessionLostHandler(endSession);

        // Si hay refresh token guardado se intenta recuperar la sesión sin pedir credenciales.
        async function restore() {
            if (!getStoredRefreshToken() || !(await refreshSession())) {
                endSession();
                return;
            }
            try {
                setUserState(await authApi.me());
                setStatus("authenticated");
            } catch {
                endSession();
            }
        }

        restore();
    }, [endSession]);

    const login = useCallback(async (email: string, password: string) => {
        storeTokens(await authApi.login(email, password));
        setUserState(await authApi.me());
        setStatus("authenticated");
    }, []);

    const register = useCallback(
        async (name: string, email: string, password: string) => {
            await authApi.register(name, email, password);
            await login(email, password);
        },
        [login],
    );

    const logout = useCallback(async () => {
        const refreshToken = getStoredRefreshToken();
        if (refreshToken) {
            try {
                await authApi.logout(refreshToken);
            } catch {
                // Aunque falle la revocación en el servidor, la sesión local se cierra igualmente.
            }
        }
        endSession();
    }, [endSession]);

    const value = useMemo(
        () => ({ status, user, login, register, logout, setUser: setUserState }),
        [status, user, login, register, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.");
    return context;
}