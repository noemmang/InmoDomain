import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { notificationsApi } from "../api/endpoints";
import { useAuth } from "./AuthContext";

interface NotificationsContextValue {
    unreadCount: number;
    refreshUnread: () => void;
    setUnreadCount: (count: number) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// Guarda el número de notificaciones sin leer para mostrarlo en la barra de navegación.
export function NotificationsProvider({ children }: { children: ReactNode }) {
    const { status } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnread = useCallback(() => {
        if (status !== "authenticated") {
            setUnreadCount(0);
            return;
        }
        notificationsApi
            .list(true)
            .then((items) => setUnreadCount(items.length))
            .catch(() => setUnreadCount(0));
    }, [status]);

    useEffect(refreshUnread, [refreshUnread]);

    const value = useMemo(() => ({ unreadCount, refreshUnread, setUnreadCount }), [unreadCount, refreshUnread]);

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
    const context = useContext(NotificationsContext);
    if (!context) throw new Error("useNotifications debe usarse dentro de NotificationsProvider.");
    return context;
}