import { useMemo } from "react";
import { propertyApi } from "../api/endpoints";
import type { Province } from "../api/types";
import { useAsync } from "./useAsync";

// La lista de provincias casi no cambia: se pide una vez por sesión y se reutiliza.
let cachedProvinces: Promise<Province[]> | null = null;

function loadProvinces(): Promise<Province[]> {
    if (!cachedProvinces) {
        cachedProvinces = propertyApi.provinces().catch((error) => {
            cachedProvinces = null;
            throw error;
        });
    }
    return cachedProvinces;
}

// Devuelve las provincias ordenadas por nombre y un diccionario por código INE.
export function useProvinces() {
    const state = useAsync(loadProvinces, []);

    const sorted = useMemo(
        () => [...(state.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, "es")),
        [state.data],
    );
    const byCode = useMemo(() => new Map(sorted.map((province) => [province.provinceCode, province])), [sorted]);

    return { provinces: sorted, byCode, loading: state.loading, error: state.error, slow: state.slow, reload: state.reload };
}