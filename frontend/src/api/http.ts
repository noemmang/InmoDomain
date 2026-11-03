import { API_URL, REFRESH_TOKEN_KEY } from "../config";
import type { AuthTokens } from "./types";

// Error de la API con el código HTTP y un mensaje listo para mostrar.
export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

// El access token solo vive en memoria; el refresh token se guarda en localStorage para recuperar la sesión.
let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;
let onSessionLost: (() => void) | null = null;

// Registra qué hacer cuando la sesión ya no se puede renovar (la usa el contexto de autenticación).
export function setSessionLostHandler(handler: () => void) {
    onSessionLost = handler;
}

// Guarda los tokens recibidos tras login o refresh.
export function storeTokens(tokens: AuthTokens) {
    accessToken = tokens.accessToken;
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

// Borra cualquier rastro de sesión del navegador.
export function clearTokens() {
    accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

// Traduce la respuesta de error del backend a un texto comprensible.
async function readErrorMessage(response: Response): Promise<string> {
    const fallback: Record<number, string> = {
        400: "Los datos enviados no son válidos.",
        401: "Credenciales o sesión no válidas.",
        404: "No se ha encontrado lo que buscas.",
        409: "Ese elemento ya existe.",
        429: "Demasiados intentos. Espera un minuto y vuelve a probar.",
        503: "El servicio no está disponible ahora mismo.",
    };

    try {
        const body = await response.json();
        const firstValidation = body?.errors ? Object.values(body.errors).flat()[0] : null;
        if (typeof firstValidation === "string") return firstValidation;
    } catch {
        // Respuesta sin cuerpo JSON: se usa el mensaje por defecto.
    }

    return fallback[response.status] ?? "Ha ocurrido un error inesperado.";
}

// Pide un access token nuevo con el refresh token guardado. Las llamadas simultáneas comparten una sola petición,
// porque el refresh token rota en cada uso y un segundo intento con el token ya gastado fallaría.
export function refreshSession(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;

    const stored = getStoredRefreshToken();
    if (!stored) return Promise.resolve(false);

    refreshPromise = fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: stored }),
    })
        .then(async (response) => {
            if (!response.ok) {
                clearTokens();
                return false;
            }
            storeTokens((await response.json()) as AuthTokens);
            return true;
        })
        .catch(() => false)
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
}

interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    // "optional" envía el token si existe pero nunca falla por no tenerlo (ficha pública de provincia).
    auth?: "required" | "optional" | "none";
}

// Cliente único de la API: añade el token, renueva la sesión una vez si el token ha caducado y reintenta.
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, auth = "none" } = options;

    const send = () => {
        const headers: Record<string, string> = {};
        if (body !== undefined) headers["Content-Type"] = "application/json";
        if (auth !== "none" && accessToken) headers.Authorization = `Bearer ${accessToken}`;

        return fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    };

    // Tras recargar la página hay refresh token pero no access token: se renueva antes de la primera llamada.
    if (auth !== "none" && !accessToken && getStoredRefreshToken()) {
        await refreshSession();
    }

    let response = await send();

    if (response.status === 401 && auth !== "none" && getStoredRefreshToken()) {
        const renewed = await refreshSession();
        if (renewed) response = await send();
    }

    if (!response.ok) {
        if (response.status === 401 && auth === "required") onSessionLost?.();
        throw new ApiError(response.status, await readErrorMessage(response));
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
}