import type { AlertCondition, AlertMetric } from "../api/types";
import { SCORE_NAME } from "./brand";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Separa una fecha "YYYY-MM-DD" a mano para evitar desfases de zona horaria al usar Date.
function splitDate(isoDate: string): { year: number; month: number } {
    const [year, month] = isoDate.split("-").map(Number);
    return { year, month };
}

// Trimestre de un periodo trimestral: "2026-04-01" -> "2T 2026".
export function formatQuarter(isoDate: string): string {
    const { year, month } = splitDate(isoDate);
    return `${Math.ceil(month / 3)}T ${year}`;
}

// Mes de un periodo mensual: "2026-04-01" -> "abr 2026".
export function formatMonth(isoDate: string): string {
    const { year, month } = splitDate(isoDate);
    return `${MONTHS[month - 1]} ${year}`;
}

// Fecha y hora legible para notificaciones y alertas.
export function formatDateTime(isoDate: string): string {
    return new Date(isoDate).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatNumber(value: number): string {
    return value.toLocaleString("es-ES");
}

export function formatPrice(value: number | null | undefined): string {
    return value == null ? "—" : `${Math.round(value).toLocaleString("es-ES")} €/m²`;
}

// Los índices se muestran con un decimal; null significa que aún no hay dato suficiente.
export function formatIndex(value: number | null | undefined): string {
    return value == null ? "—" : value.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

// Número con los decimales indicados y, si se pide, signo explícito. Un valor que redondea a cero no lleva signo.
export function formatDecimal(value: number | null | undefined, decimals = 1, signed = false): string {
    if (value == null) return "—";
    const rounded = Number(value.toFixed(decimals));
    const text = Math.abs(rounded).toLocaleString("es-ES", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
    if (rounded < 0) return `−${text}`;
    return signed && rounded > 0 ? `+${text}` : text;
}

// Porcentaje con un decimal: "+4,2 %" si lleva signo, "12,4 %" si no.
export function formatPercent(value: number | null | undefined, signed = false): string {
    return value == null ? "—" : `${formatDecimal(value, 1, signed)}\u00A0%`;
}

export function formatSigned(value: number | null | undefined): string {
    if (value == null) return "—";
    const text = Math.abs(value).toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
    return `${value > 0 ? "+" : value < 0 ? "−" : ""}${text}`;
}

export const METRIC_LABELS: Record<AlertMetric, string> = {
    property_score: SCORE_NAME,
    indice_precio: "Índice de precio",
    indice_tendencia_precio: "Tendencia de precio",
    indice_actividad: "Índice de actividad",
    precio_m2: "Precio por m²",
};

export const CONDITION_LABELS: Record<AlertCondition, string> = {
    mayor_que: "es mayor que",
    menor_que: "es menor que",
};

// Clasifica una puntuación 0-100 para colorearla (alta, media o baja).
export function scoreTone(value: number | null | undefined): "high" | "mid" | "low" | "none" {
    if (value == null) return "none";
    if (value >= 66) return "high";
    if (value >= 33) return "mid";
    return "low";
}

// Iniciales de un nombre para el avatar.
export function initials(name: string): string {
    return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}