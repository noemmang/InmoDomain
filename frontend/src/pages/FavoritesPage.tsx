import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { analyticsApi } from "../api/endpoints";
import { ButtonLink } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { useFavorites } from "../context/FavoritesContext";
import { useAsync } from "../hooks/useAsync";
import { useLatestPeriod } from "../hooks/useLatestPeriod";
import { useProvinces } from "../hooks/useProvinces";
import { formatIndex, formatQuarter, formatSigned, scoreTone } from "../utils/format";

// Provincias guardadas por el usuario, con su Property Score y tendencia del último trimestre.
export function FavoritesPage() {
    const { favorites, loading, toggle } = useFavorites();
    const { byCode } = useProvinces();
    const periodState = useLatestPeriod();

    const codes = favorites.map((favorite) => favorite.provinceCode);
    const entriesState = useAsync(
        () => (codes.length > 0 && periodState.period ? analyticsApi.compare(codes, periodState.period) : Promise.resolve([])),
        [codes.join(","), periodState.period],
    );

    if (loading || periodState.loading) return <div className="page"><LoadingState slow={periodState.slow} label="Cargando tus favoritos" /></div>;
    if (periodState.error || entriesState.error) {
        return <div className="page"><ErrorState message={(periodState.error ?? entriesState.error)!} onRetry={entriesState.reload} /></div>;
    }

    const entries = new Map((entriesState.data ?? []).map((entry) => [entry.provinceCode, entry]));

    return (
        <div className="page">
            <header className="page__header">
                <div>
                    <h1 className="page__title">Favoritos</h1>
                    <p className="page__subtitle">{periodState.period ? `Datos del ${formatQuarter(periodState.period)}` : "Tus provincias guardadas"}</p>
                </div>
            </header>

            {favorites.length === 0 ? (
                <EmptyState
                    title="Aún no tienes favoritos"
                    text="Marca una provincia con la estrella para seguirla desde aquí."
                    action={<ButtonLink to="/explorar">Explorar provincias</ButtonLink>}
                />
            ) : (
                <div className="card-grid">
                    {favorites.map((favorite) => {
                        const entry = entries.get(favorite.provinceCode);
                        const province = byCode.get(favorite.provinceCode);
                        return (
                            <Card key={favorite.id} className="favorite-card">
                                <Link className="favorite-card__link" to={`/provincia/${favorite.provinceCode}`}>
                                    <h2 className="favorite-card__name">{favorite.provinceName}</h2>
                                    <p className="favorite-card__community">{province?.autonomousCommunity}</p>
                                </Link>
                                <div className="favorite-card__metrics">
                                    <div>
                                        <span className="stat__label">Score</span>
                                        <span className={`score-pill score-pill--${scoreTone(entry?.score)}`}>{formatIndex(entry?.score)}</span>
                                    </div>
                                    <div>
                                        <span className="stat__label">Tendencia</span>
                                        <strong>{formatSigned(entry?.priceTrendIndex)}</strong>
                                    </div>
                                </div>
                                <button type="button" className="icon-button favorite-card__remove" aria-label={`Quitar ${favorite.provinceName} de favoritos`} onClick={() => toggle(favorite.provinceCode)}>
                                    <Trash2 size={18} />
                                </button>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}