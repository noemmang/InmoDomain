// URL base del Gateway. En local apunta al Gateway de desarrollo; en producción la fija VITE_API_URL en el build.
export const API_URL: string = (import.meta.env.VITE_API_URL ?? "http://localhost:5001").replace(/\/$/, "");

// Clave de localStorage donde se guarda el refresh token (el access token solo vive en memoria).
export const REFRESH_TOKEN_KEY = "inmodomain.refreshToken";

// Provincia usada para averiguar el último trimestre calculado (Madrid existe siempre tras el seed).
export const REFERENCE_PROVINCE = "28";