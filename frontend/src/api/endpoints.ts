import { request } from "./http";
import type {
    Alert, AlertInput, AppNotification, AuthTokens, CompareEntry, Favorite,
    Province, ProvinceAnalytics, UserProfile,
} from "./types";

// Identity: registro, sesión y perfil.
export const authApi = {
    register: (name: string, email: string, password: string) =>
        request<UserProfile>("/api/v1/auth/register", { method: "POST", body: { name, email, password } }),
    login: (email: string, password: string) =>
        request<AuthTokens>("/api/v1/auth/login", { method: "POST", body: { email, password } }),
    logout: (refreshToken: string) =>
        request<void>("/api/v1/auth/logout", { method: "POST", body: { refreshToken } }),
    forgotPassword: (email: string) =>
        request<void>("/api/v1/auth/forgot-password", { method: "POST", body: { email } }),
    resetPassword: (token: string, newPassword: string) =>
        request<void>("/api/v1/auth/reset-password", { method: "POST", body: { token, newPassword } }),
    me: () => request<UserProfile>("/api/v1/auth/me", { auth: "required" }),
    // profilePhoto: data URL en base64, o null para eliminar la foto actual.
    updateMe: (name: string, email: string, profilePhoto: string | null) =>
        request<UserProfile>("/api/v1/auth/me", { method: "PUT", body: { name, email, profilePhoto }, auth: "required" }),
    changePassword: (currentPassword: string, newPassword: string) =>
        request<void>("/api/v1/auth/me/password", {
            method: "PUT", body: { currentPassword, newPassword }, auth: "required",
        }),
};

// Property: provincias y favoritos.
export const propertyApi = {
    provinces: () => request<Province[]>("/api/v1/provinces"),
    favorites: () => request<Favorite[]>("/api/v1/favorites", { auth: "required" }),
    addFavorite: (provinceCode: string) =>
        request<Favorite>("/api/v1/favorites", { method: "POST", body: { provinceCode }, auth: "required" }),
    removeFavorite: (id: string) =>
        request<void>(`/api/v1/favorites/${id}`, { method: "DELETE", auth: "required" }),
};

// Analytics: ficha de provincia (token opcional) y comparador.
export const analyticsApi = {
    province: (code: string, trendQuarters?: number) => {
        const query = trendQuarters ? `?trendQuarters=${trendQuarters}` : "";
        return request<ProvinceAnalytics>(`/api/v1/provinces/${code}/analytics${query}`, { auth: "optional" });
    },
    // Ficha sin token: el panel pide las 52 provincias y no necesita saber cuáles son favoritas.
    provinceMarket: (code: string) => request<ProvinceAnalytics>(`/api/v1/provinces/${code}/analytics`),
    compare: (codes: string[], period: string) =>
        request<CompareEntry[]>(`/api/v1/analytics/compare?provinceCodes=${codes.join(",")}&period=${period}`),
};

// Alerts: CRUD de alertas del usuario.
export const alertsApi = {
    list: () => request<Alert[]>("/api/v1/alerts", { auth: "required" }),
    create: (input: AlertInput) =>
        request<Alert>("/api/v1/alerts", { method: "POST", body: input, auth: "required" }),
    update: (id: string, input: AlertInput, active: boolean) =>
        request<Alert>(`/api/v1/alerts/${id}`, { method: "PUT", body: { ...input, active }, auth: "required" }),
    remove: (id: string) => request<void>(`/api/v1/alerts/${id}`, { method: "DELETE", auth: "required" }),
};

// Notifications: avisos dentro de la app.
export const notificationsApi = {
    list: (unreadOnly = false) =>
        request<AppNotification[]>(`/api/v1/notifications?unreadOnly=${unreadOnly}&limit=100`, { auth: "required" }),
    markRead: (id: string) =>
        request<void>(`/api/v1/notifications/${id}/read`, { method: "PUT", auth: "required" }),
    markAllRead: () => request<void>("/api/v1/notifications/read-all", { method: "PUT", auth: "required" }),
    remove: (id: string) => request<void>(`/api/v1/notifications/${id}`, { method: "DELETE", auth: "required" }),
};