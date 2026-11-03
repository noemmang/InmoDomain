import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Province } from "../api/types";

interface ProvinceSelectProps {
    provinces: Province[];
    onSelect: (provinceCode: string) => void;
    placeholder?: string;
    exclude?: string[];
}

// Buscador de provincias con lista desplegable filtrada por nombre o comunidad autónoma.
export function ProvinceSelect({ provinces, onSelect, placeholder = "Buscar provincia", exclude = [] }: ProvinceSelectProps) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const matches = useMemo(() => {
        const text = query.trim().toLowerCase();
        return provinces
            .filter((province) => !exclude.includes(province.provinceCode))
            .filter((province) => !text || `${province.name} ${province.autonomousCommunity}`.toLowerCase().includes(text))
            .slice(0, 8);
    }, [provinces, query, exclude]);

    // Cierra la lista al hacer clic fuera del componente.
    useEffect(() => {
        function handleOutside(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    function choose(code: string) {
        onSelect(code);
        setQuery("");
        setOpen(false);
    }

    return (
        <div className="province-select" ref={rootRef}>
            <Search className="province-select__icon" size={18} aria-hidden="true" />
            <input
                className="province-select__input"
                type="search"
                value={query}
                placeholder={placeholder}
                aria-label={placeholder}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" && matches[0]) choose(matches[0].provinceCode);
                    if (event.key === "Escape") setOpen(false);
                }}
            />
            {open && matches.length > 0 && (
                <ul className="province-select__list">
                    {matches.map((province) => (
                        <li key={province.provinceCode}>
                            <button type="button" className="province-select__item" onClick={() => choose(province.provinceCode)}>
                                <span>{province.name}</span>
                                <small>{province.autonomousCommunity}</small>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}