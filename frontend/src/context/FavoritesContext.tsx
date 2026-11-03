import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { propertyApi } from "../api/endpoints";
import type { Favorite } from "../api/types";
import { useAuth } from "./AuthContext";

interface FavoritesContextValue {
    favorites: Favorite[];
    loading: boolean;
    isFavorite: (provinceCode: string) => boolean;
    toggle: (provinceCode: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

// Carga los favoritos del usuario al iniciar sesión y permite añadir o quitar una provincia desde cualquier pantalla.
export function FavoritesProvider({ children }: { children: ReactNode }) {
    const { status } = useAuth();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status !== "authenticated") {
            setFavorites([]);
            return;
        }
        setLoading(true);
        propertyApi
            .favorites()
            .then(setFavorites)
            .catch(() => setFavorites([]))
            .finally(() => setLoading(false));
    }, [status]);

    const isFavorite = useCallback(
        (provinceCode: string) => favorites.some((favorite) => favorite.provinceCode === provinceCode),
        [favorites],
    );

    const toggle = useCallback(
        async (provinceCode: string) => {
            const existing = favorites.find((favorite) => favorite.provinceCode === provinceCode);
            if (existing) {
                await propertyApi.removeFavorite(existing.id);
                setFavorites((current) => current.filter((favorite) => favorite.id !== existing.id));
            } else {
                const created = await propertyApi.addFavorite(provinceCode);
                setFavorites((current) => [...current, created]);
            }
        },
        [favorites],
    );

    const value = useMemo(() => ({ favorites, loading, isFavorite, toggle }), [favorites, loading, isFavorite, toggle]);

    return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
    const context = useContext(FavoritesContext);
    if (!context) throw new Error("useFavorites debe usarse dentro de FavoritesProvider.");
    return context;
}