import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncState<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
    // Se activa tras unos segundos de espera: el servidor puede estar arrancando en frío.
    slow: boolean;
    reload: () => void;
    setData: (data: T | null) => void;
}

const SLOW_AFTER_MS = 4000;

// Ejecuta una función asíncrona cuando cambian las dependencias y expone datos, error y estado de carga.
export function useAsync<T>(task: () => Promise<T>, deps: unknown[]): AsyncState<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [slow, setSlow] = useState(false);
    const [version, setVersion] = useState(0);
    const taskRef = useRef(task);
    taskRef.current = task;

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setSlow(false);
        const timer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);

        taskRef.current()
            .then((result) => {
                if (!cancelled) setData(result);
            })
            .catch((reason: unknown) => {
                if (!cancelled) setError(reason instanceof Error ? reason.message : "Ha ocurrido un error inesperado.");
            })
            .finally(() => {
                window.clearTimeout(timer);
                if (!cancelled) {
                    setLoading(false);
                    setSlow(false);
                }
            });

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, version]);

    const reload = useCallback(() => setVersion((current) => current + 1), []);

    return { data, error, loading, slow, reload, setData };
}