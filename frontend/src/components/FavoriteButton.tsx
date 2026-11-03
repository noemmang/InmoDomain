import { Star } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

// Estrella para marcar o desmarcar una provincia. Sin sesión, lleva a iniciar sesión.
export function FavoriteButton({ provinceCode, withLabel }: { provinceCode: string; withLabel?: boolean }) {
    const { status } = useAuth();
    const { isFavorite, toggle } = useFavorites();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const active = isFavorite(provinceCode);

    async function handleClick() {
        if (status !== "authenticated") {
            navigate("/login", { state: { from: `/provincia/${provinceCode}` } });
            return;
        }
        setBusy(true);
        try {
            await toggle(provinceCode);
        } finally {
            setBusy(false);
        }
    }

    return (
        <button
            type="button"
            className={`favorite-button${active ? " favorite-button--active" : ""}${withLabel ? " favorite-button--labeled" : ""}`}
            onClick={handleClick}
            disabled={busy}
            aria-pressed={active}
            aria-label={active ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
            <Star size={18} aria-hidden="true" />
            {withLabel && <span>{active ? "En favoritos" : "Añadir a favoritos"}</span>}
        </button>
    );
}