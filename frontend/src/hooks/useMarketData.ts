import { useCallback, useEffect, useMemo, useState } from "react";
import { analyticsApi } from "../api/endpoints";
import type { ProvinceAnalytics } from "../api/types";
import { buildSeries, type ProvinceSeries } from "../utils/market";
import { useProvinces } from "./useProvinces";

const CONCURRENCY = 6;
const SLOW_AFTER_MS = 4000;

// Las fichas pesan poco y cambian como mucho una vez al día: se guardan durante la sesión y las peticiones en vuelo se comparten.
const cache = new Map<string, ProvinceAnalytics>();
const inFlight = new Map<string, Promise<ProvinceAnalytics>>();

// Ficha de una provincia con la caché de sesión; la reutilizan Explorar y el comparador.
export function loadProvince(code: string): Promise<ProvinceAnalytics> {
    const cached = cache.get(code);
    if (cached) return Promise.resolve(cached);

    let pending = inFlight.get(code);
    if (!pending) {
        pending = analyticsApi
            .provinceMarket(code)
            .then((analytics) => {
                cache.set(code, analytics);
                return analytics;
            })
            .finally(() => inFlight.delete(code));
        inFlight.set(code, pending);
    }
    return pending;
}

// Carga la ficha analítica de las 52 provincias con pocas peticiones a la vez y expone el avance para pintarlo mientras llegan.
export function useMarketData() {
    const provincesState = useProvinces();
    const [loadedCount, setLoadedCount] = useState(cache.size);
    const [failed, setFailed] = useState<string[]>([]);
    const [finished, setFinished] = useState(false);
    const [slow, setSlow] = useState(false);
    const [attempt, setAttempt] = useState(0);

    const { provinces } = provincesState;

    useEffect(() => {
        if (provinces.length === 0) return;

        let cancelled = false;
        const pending = provinces.map((province) => province.provinceCode).filter((code) => !cache.has(code));
        const failures: string[] = [];
        let next = 0;

        setFinished(false);
        setFailed([]);
        setLoadedCount(cache.size);
        const timer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);

        // Cada trabajador toma la siguiente provincia pendiente hasta vaciar la lista.
        async function worker() {
            while (!cancelled && next < pending.length) {
                const code = pending[next];
                next += 1;
                try {
                    await loadProvince(code);
                    if (!cancelled) setLoadedCount(cache.size);
                } catch {
                    failures.push(code);
                }
            }
        }

        Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker)).then(() => {
            window.clearTimeout(timer);
            if (cancelled) return;
            setFailed(failures);
            setFinished(true);
            setSlow(false);
        });

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [provinces, attempt]);

    // Las series se reconstruyen solo cuando llega una provincia nueva.
    const series: ProvinceSeries[] = useMemo(
        () => provinces.flatMap((province) => {
            const analytics = cache.get(province.provinceCode);
            return analytics ? [buildSeries(province, analytics)] : [];
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [provinces, loadedCount],
    );

    const retry = useCallback(() => {
        provincesState.reload();
        setAttempt((current) => current + 1);
    }, [provincesState]);

    return {
        provinces,
        series,
        total: provinces.length,
        loaded: loadedCount,
        failed,
        finished,
        slow: (slow && loadedCount === 0) || provincesState.slow,
        loading: provincesState.loading || (provinces.length > 0 && !finished && loadedCount < provinces.length),
        error: provincesState.error,
        retry,
    };
}
