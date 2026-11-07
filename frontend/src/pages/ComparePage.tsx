import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CompareEntry } from "../api/types";
import { CompareChart } from "../charts/CompareChart";
import { ConstructionCompareChart } from "../charts/ConstructionCompareChart";
import type { IndexView } from "../charts/EvolutionChart";
import { Card } from "../components/Card";
import { ProvinceSelect } from "../components/ProvinceSelect";
import { SegmentedControl } from "../components/SegmentedControl";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { TimeSlider } from "../components/TimeSlider";
import { useAsync } from "../hooks/useAsync";
import { loadProvince } from "../hooks/useMarketData";
import { useProvinces } from "../hooks/useProvinces";
import { formatDecimal, formatIndex, formatNumber, formatPercent, formatPrice, formatQuarter, formatSigned, scoreTone } from "../utils/format";
import { buildSeries, computeRow, constructionQuarters, defaultQuarter, priceQuarters } from "../utils/market";

const MAX_PROVINCES = 4;

// Comparador de hasta cuatro provincias con línea temporal: índices, precio y obra de vivienda en el trimestre elegido. La selección vive en la URL (?p=28,08) para poder compartirla.
export function ComparePage() {
    const [params, setParams] = useSearchParams();
    const { provinces, byCode, loading: provincesLoading } = useProvinces();
    const [view, setView] = useState<IndexView>("historical");
    const [chosenPeriod, setChosenPeriod] = useState<string | null>(null);

    const selected = (params.get("p") ?? "").split(",").filter(Boolean).slice(0, MAX_PROVINCES);
    const selectionKey = selected.join(",");

    // Todo sale de la ficha completa de cada provincia (con la caché de Explorar), de modo que cambiar de trimestre no hace peticiones nuevas.
    const marketState = useAsync(() => Promise.all(selected.map((code) => loadProvince(code))), [selectionKey]);

    const series = useMemo(() => {
        const analytics = marketState.data;
        if (!analytics || analytics.length !== selected.length) return [];
        return selected.flatMap((code, index) => {
            const province = byCode.get(code);
            return province ? [buildSeries(province, analytics[index])] : [];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketState.data, byCode, selectionKey]);

    // Trimestres con precio en todas las provincias elegidas; el de partida es el último con Índice.
    const quarters = useMemo(() => priceQuarters(series), [series]);
    const defaultPeriod = useMemo(() => defaultQuarter(series, quarters), [series, quarters]);
    const period = chosenPeriod && quarters.includes(chosenPeriod) ? chosenPeriod : defaultPeriod;

    const rows = useMemo(() => (period ? series.map((item) => computeRow(item, period)) : []), [series, period]);

    // Índices del trimestre elegido, con el mismo formato que devolvía el comparador de Analytics.
    const entries: CompareEntry[] = useMemo(
        () => series.flatMap((item) => {
            const score = item.scores.get(period ?? "");
            return score ? [{ ...score, provinceCode: item.code }] : [];
        }),
        [series, period],
    );

    // La obra llega con más retraso que el precio: si el trimestre elegido no la tiene completa, se usa el último anterior con dato.
    const constructionPeriods = useMemo(() => constructionQuarters(series, quarters), [series, quarters]);
    const constructionPeriod = period
        ? (constructionPeriods.includes(period) ? period : constructionPeriods.filter((item) => item <= period).at(-1) ?? constructionPeriods.at(-1) ?? null)
        : null;
    const constructionRows = useMemo(
        () => (constructionPeriod ? series.map((item) => computeRow(item, constructionPeriod)) : []),
        [series, constructionPeriod],
    );

    function updateSelection(codes: string[]) {
        setParams(codes.length ? { p: codes.join(",") } : {}, { replace: true });
    }

    const names = new Map(provinces.map((province) => [province.provinceCode, province.name]));
    return (
        <div className="page">
            <header className="page__header">
                <div>
                    <h1 className="page__title">Comparar provincias</h1>
                    <p className="page__subtitle">
                        Elige hasta {MAX_PROVINCES} provincias{period && <> · Datos del {formatQuarter(period)}</>}
                    </p>
                </div>
                <SegmentedControl
                    label="Tipo de índice"
                    value={view}
                    onChange={setView}
                    options={[{ value: "historical", label: "Percentil histórico" }, { value: "national", label: "Ranking nacional" }]}
                />
            </header>

            <Card>
                <div className="compare-picker">
                    {selected.length < MAX_PROVINCES && (
                        <ProvinceSelect
                            provinces={provinces}
                            exclude={selected}
                            placeholder="Añadir provincia…"
                            onSelect={(code) => updateSelection([...selected, code])}
                        />
                    )}
                    <ul className="chips">
                        {selected.map((code) => (
                            <li key={code} className="chip">
                                {byCode.get(code)?.name ?? code}
                                <button type="button" className="chip__remove" aria-label={`Quitar ${byCode.get(code)?.name ?? code}`} onClick={() => updateSelection(selected.filter((item) => item !== code))}>
                                    <X size={14} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </Card>

            {provincesLoading || (marketState.loading && selected.length > 0) ? (
                <LoadingState slow={marketState.slow} label="Comparando" />
            ) : marketState.error ? (
                <ErrorState message={marketState.error} onRetry={marketState.reload} />
            ) : selected.length === 0 ? (
                <EmptyState title="Selecciona provincias para empezar" text="Busca arriba al menos dos provincias y verás sus índices lado a lado." />
            ) : !period || entries.length === 0 ? (
                <EmptyState title="Sin datos para esta selección" text="Las provincias elegidas aún no tienen índices calculados." />
            ) : (
                <>
                    <Card title="Evolución en el tiempo">
                        <TimeSlider periods={quarters} value={period} onChange={setChosenPeriod} />
                    </Card>
                    <Card title="Índices lado a lado">
                        <CompareChart entries={entries} names={names} indexView={view} />
                    </Card>
                    <Card title="Detalle" flush>
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th scope="col">Provincia</th>
                                        <th scope="col">Índice</th>
                                        <th scope="col">Índ. precio</th>
                                        <th scope="col">€/m²</th>
                                        <th scope="col">Tendencia</th>
                                        <th scope="col">Actividad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry) => (
                                        <tr key={entry.provinceCode}>
                                            <td><Link className="table__province" to={`/provincia/${entry.provinceCode}`}><strong>{names.get(entry.provinceCode)}</strong></Link></td>
                                            <td><span className={`score-pill score-pill--${scoreTone(entry.score)}`}>{formatIndex(entry.score)}</span></td>
                                            <td>{formatIndex(view === "historical" ? entry.priceIndex : entry.priceIndexNationalRanking)}</td>
                                            <td>{formatPrice(rows.find((row) => row.code === entry.provinceCode)?.price)}</td>
                                            <td>{formatSigned(view === "historical" ? entry.priceTrendIndex : entry.priceTrendIndexYearOverYear)}</td>
                                            <td>{formatIndex(view === "historical" ? entry.activityIndex : entry.activityIndexNationalRanking)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}

            {selected.length > 0 && constructionPeriod && constructionRows.length > 0 && (
                <>
                    <Card title={`Obra de vivienda · ${formatQuarter(constructionPeriod)}`}>
                        <ConstructionCompareChart rows={constructionRows} />
                        <p className="chart__note">Viviendas iniciadas y terminadas por 10.000 habitantes en el trimestre (MIVAU, vía ISTAC).</p>
                    </Card>
                    <Card title="Obra · detalle" flush>
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th scope="col">Provincia</th>
                                        <th scope="col">Iniciadas</th>
                                        <th scope="col">Por 10.000 hab.</th>
                                        <th scope="col">Var. anual</th>
                                        <th scope="col">Protegida</th>
                                        <th scope="col">Terminadas</th>
                                        <th scope="col">Por 100 compraventas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {constructionRows.map((row) => (
                                        <tr key={row.code}>
                                            <td><Link className="table__province" to={`/provincia/${row.code}`}><strong>{row.name}</strong></Link></td>
                                            <td>{row.started == null ? "—" : formatNumber(row.started)}</td>
                                            <td>{formatDecimal(row.startedRate)}</td>
                                            <td className={(row.startedChange ?? 0) < 0 ? "text-negative" : "text-positive"}>{formatPercent(row.startedChange, true)}</td>
                                            <td>{formatPercent(row.protectedShare)}</td>
                                            <td>{row.completed == null ? "—" : formatNumber(row.completed)}</td>
                                            <td>{formatDecimal(row.supplyRatio, 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}