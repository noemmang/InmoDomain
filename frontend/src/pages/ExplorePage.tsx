import { SCORE_NAME } from "../utils/brand";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { analyticsApi } from "../api/endpoints";
import type { CompareEntry } from "../api/types";
import { RankingChart } from "../charts/RankingChart";
import type { IndexView } from "../charts/EvolutionChart";
import { Card } from "../components/Card";
import { FavoriteButton } from "../components/FavoriteButton";
import { SegmentedControl } from "../components/SegmentedControl";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { useAsync } from "../hooks/useAsync";
import { useLatestPeriod } from "../hooks/useLatestPeriod";
import { useProvinces } from "../hooks/useProvinces";
import { formatIndex, formatQuarter, formatSigned, scoreTone } from "../utils/format";

type SortKey = "name" | "score" | "price" | "trend" | "activity";

interface Row {
    code: string;
    name: string;
    community: string;
    entry: CompareEntry | undefined;
}

// Panel principal: ranking nacional de provincias por Índice InmoDomain en el último trimestre calculado.
export function ExplorePage() {
    const provincesState = useProvinces();
    const periodState = useLatestPeriod();
    const [view, setView] = useState<IndexView>("historical");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "score", direction: "desc" });

    const codes = provincesState.provinces.map((province) => province.provinceCode);
    const entriesState = useAsync(
        () => (periodState.period && codes.length > 0 ? analyticsApi.compare(codes, periodState.period) : Promise.resolve([])),
        [periodState.period, codes.length],
    );

    const rows: Row[] = useMemo(() => {
        const entries = new Map((entriesState.data ?? []).map((entry) => [entry.provinceCode, entry]));
        return provincesState.provinces.map((province) => ({
            code: province.provinceCode,
            name: province.name,
            community: province.autonomousCommunity,
            entry: entries.get(province.provinceCode),
        }));
    }, [provincesState.provinces, entriesState.data]);

    const priceOf = (entry?: CompareEntry) => (view === "historical" ? entry?.priceIndex : entry?.priceIndexNationalRanking);
    const activityOf = (entry?: CompareEntry) => (view === "historical" ? entry?.activityIndex : entry?.activityIndexNationalRanking);

    const visibleRows = useMemo(() => {
        const text = query.trim().toLowerCase();
        const value = (row: Row): number | string => {
            if (sort.key === "name") return row.name;
            if (sort.key === "score") return row.entry?.score ?? -Infinity;
            if (sort.key === "price") return priceOf(row.entry) ?? -Infinity;
            if (sort.key === "trend") return row.entry?.priceTrendIndex ?? -Infinity;
            return activityOf(row.entry) ?? -Infinity;
        };
        const direction = sort.direction === "asc" ? 1 : -1;

        return rows
            .filter((row) => !text || `${row.name} ${row.community}`.toLowerCase().includes(text))
            .sort((a, b) => {
                const left = value(a);
                const right = value(b);
                if (typeof left === "string" && typeof right === "string") return left.localeCompare(right, "es") * direction;
                return ((left as number) - (right as number)) * direction;
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, query, sort, view]);

    const scored = rows.filter((row) => row.entry?.score != null);
    const top = [...scored].sort((a, b) => (b.entry!.score ?? 0) - (a.entry!.score ?? 0));
    const average = scored.length ? scored.reduce((sum, row) => sum + (row.entry!.score ?? 0), 0) / scored.length : null;

    function changeSort(key: SortKey) {
        setSort((current) => ({ key, direction: current.key === key && current.direction === "desc" ? "asc" : "desc" }));
    }

    const loading = provincesState.loading || periodState.loading || (entriesState.loading && !entriesState.data);
    const slow = provincesState.slow || periodState.slow || entriesState.slow;
    const error = provincesState.error ?? periodState.error ?? entriesState.error;

    if (loading) return <div className="page"><LoadingState slow={slow} label="Cargando el mercado" /></div>;
    if (error) {
        return (
            <div className="page">
                <ErrorState message={error} onRetry={() => { provincesState.reload(); periodState.reload(); entriesState.reload(); }} />
            </div>
        );
    }
    if (!periodState.period || scored.length === 0) {
        return (
            <div className="page">
                <EmptyState title="Aún no hay índices calculados" text="Cuando el importador procese los datos del INE y el MIVAU aparecerán aquí." />
            </div>
        );
    }

    const header = (key: SortKey, label: string) => (
        <th scope="col" aria-sort={sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
            <button type="button" className="table__sort" onClick={() => changeSort(key)}>
                {label}
                {sort.key === key && (sort.direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
            </button>
        </th>
    );

    return (
        <div className="page">
            <header className="page__header">
                <div>
                    <h1 className="page__title">Mercado inmobiliario</h1>
                    <p className="page__subtitle">Datos del {formatQuarter(periodState.period)} · {scored.length} provincias con índices</p>
                </div>
                <SegmentedControl
                    label="Tipo de índice"
                    value={view}
                    onChange={setView}
                    options={[{ value: "historical", label: "Percentil histórico" }, { value: "national", label: "Ranking nacional" }]}
                />
            </header>

            <div className="stat-grid">
                <Card className="stat">
                    <span className="stat__label">Mejor {SCORE_NAME}</span>
                    <strong className="stat__value">{top[0].name}</strong>
                    <span className="stat__note">{formatIndex(top[0].entry!.score)} sobre 100</span>
                </Card>
                <Card className="stat">
                    <span className="stat__label">Media nacional del índice</span>
                    <strong className="stat__value">{formatIndex(average)}</strong>
                    <span className="stat__note">media de las provincias con datos</span>
                </Card>
                <Card className="stat">
                    <span className="stat__label">Último trimestre</span>
                    <strong className="stat__value">{formatQuarter(periodState.period)}</strong>
                    <span className="stat__note">último periodo calculado</span>
                </Card>
            </div>

            <div className="grid-two">
                <Card title={`Top 10 por ${SCORE_NAME}`}>
                    <RankingChart items={top.slice(0, 10).map((row) => ({ name: row.name, score: row.entry!.score ?? 0 }))} />
                </Card>

                <Card
                    title="Todas las provincias"
                    flush
                    action={
                        <input
                            className="table-search"
                            type="search"
                            placeholder="Filtrar…"
                            aria-label="Filtrar provincias"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    }
                >
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    {header("name", "Provincia")}
                                    {header("score", "Índice")}
                                    {header("price", "Precio")}
                                    {header("trend", "Tendencia")}
                                    {header("activity", "Actividad")}
                                    <th scope="col"><span className="visually-hidden">Favorito</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRows.map((row) => (
                                    <tr key={row.code}>
                                        <td>
                                            <Link className="table__province" to={`/provincia/${row.code}`}>
                                                <strong>{row.name}</strong>
                                                <small>{row.community}</small>
                                            </Link>
                                        </td>
                                        <td><span className={`score-pill score-pill--${scoreTone(row.entry?.score)}`}>{formatIndex(row.entry?.score)}</span></td>
                                        <td>{formatIndex(priceOf(row.entry))}</td>
                                        <td className={(row.entry?.priceTrendIndex ?? 0) < 0 ? "text-negative" : "text-positive"}>{formatSigned(row.entry?.priceTrendIndex)}</td>
                                        <td>{formatIndex(activityOf(row.entry))}</td>
                                        <td><FavoriteButton provinceCode={row.code} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}