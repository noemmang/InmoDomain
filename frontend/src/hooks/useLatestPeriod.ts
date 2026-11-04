import { analyticsApi } from "../api/endpoints";
import { REFERENCE_PROVINCE } from "../config";
import { useAsync } from "./useAsync";

// El último trimestre con índices completos se averigua una vez mirando el histórico de la provincia de referencia.
let cachedPeriod: Promise<string | null> | null = null;

function loadLatestPeriod(): Promise<string | null> {
    if (!cachedPeriod) {
        cachedPeriod = analyticsApi
            .province(REFERENCE_PROVINCE)
            .then((analytics) => {
                const history = [...analytics.history].sort((a, b) => a.period.localeCompare(b.period));
                // El trimestre en curso solo trae la actividad del INE hasta que el MIVAU publica el precio:
                // se usa el último con Índice calculado y, si ninguno lo tiene, el más reciente.
                const latest = history.filter((row) => row.score != null).at(-1) ?? history.at(-1);
                return latest?.period ?? null;
            })
            .catch((error) => {
                cachedPeriod = null;
                throw error;
            });
    }
    return cachedPeriod;
}

// Último trimestre con índices completos; null si todavía no hay ninguno.
export function useLatestPeriod() {
    const state = useAsync(loadLatestPeriod, []);
    return { period: state.data, loading: state.loading, error: state.error, slow: state.slow, reload: state.reload };
}