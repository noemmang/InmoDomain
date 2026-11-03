import { analyticsApi } from "../api/endpoints";
import { REFERENCE_PROVINCE } from "../config";
import { useAsync } from "./useAsync";

// El último trimestre calculado se averigua una vez mirando el histórico de la provincia de referencia.
let cachedPeriod: Promise<string | null> | null = null;

function loadLatestPeriod(): Promise<string | null> {
    if (!cachedPeriod) {
        cachedPeriod = analyticsApi
            .province(REFERENCE_PROVINCE)
            .then((analytics) => analytics.history.map((row) => row.period).sort().at(-1) ?? null)
            .catch((error) => {
                cachedPeriod = null;
                throw error;
            });
    }
    return cachedPeriod;
}

// Último trimestre con índices calculados; null si todavía no hay ninguno.
export function useLatestPeriod() {
    const state = useAsync(loadLatestPeriod, []);
    return { period: state.data, loading: state.loading, error: state.error, slow: state.slow, reload: state.reload };
}