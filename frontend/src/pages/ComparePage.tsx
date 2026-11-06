import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { analyticsApi } from "../api/endpoints";
import { CompareChart } from "../charts/CompareChart";
import { ConstructionCompareChart } from "../charts/ConstructionCompareChart";
import type { IndexView } from "../charts/EvolutionChart";
import { Card } from "../components/Card";
import { ProvinceSelect } from "../components/ProvinceSelect";
import { SegmentedControl } from "../components/SegmentedControl";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { useAsync } from "../hooks/useAsync";
import { useLatestPeriod } from "../hooks/useLatestPeriod";
import { loadProvince } from "../hooks/useMarketData";
import { useProvinces } from "../hooks/useProvinces";
import { formatDecimal, formatIndex, formatNumber, formatPercent, formatQuarter, formatSigned, scoreTone } from "../utils/format";
import { buildSeries, computeRow, latestConstructionQuarter } from "../utils/market";

const MAX_PROVINCES = 4;

// Comparador de hasta cuatro provincias: índices lado a lado y obra de vivienda. La selección vive en la URL (?p=28,08) para poder compartirla.
export function ComparePage() {
    const [params, setParams] = useSearchParams();
    const { provinces, byCode, loading: provincesLoading } = useProvinces();
    const periodState = useLatestPeriod();
    const [view, setView] = useState<IndexView>("historical");

    const selected = (params.get("p") ?? "").split(",").filter(Boolean).slice(0, MAX_PROVINCES);

    const entriesState = useAsync(
        () => (selected.length > 0 && periodState.period ? analyticsApi.compare(selected, periodState.period) : Promise.resolve([])),
        [selected.join(","), periodState.period],
    );

    // La obra sale de la ficha completa de cada provincia (con la caché de Explorar); es un dato complementario, así que un fallo no bloquea los índices.
    const marketState = useAsync(() => Promise.all(selected.map((code) => loadProvince(code))), [selected.join(",")]);

    // Todas las provincias se comparan en el mismo trimestre: el último con obra completa en todas ellas.
    const construction = useMemo(() => {
        const analytics = marketState.data;
        if (!analytics) return null;

        const series = selected.flatMap((code, index) => {
            const province = byCode.get(code);
            return province && analytics[index] ? [buildSeries(province, analytics[index])] : [];
        });
        const periods = series.map(latestConstructionQuarter).filter((period): period is string => period != null).sort();
        if (periods.length === 0) return null;

        return { period: periods[0], rows: series.map((item) => computeRow(item, periods[0])) };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketState.data, byCode, selected.join(",")]);

    function updateSelection(codes: string[]) {
        setParams(codes.length ? { p: codes.join(",") } : {}, { replace: true });
    }

    const names = new Map(provinces.map((province) => [province.provinceCode, province.name]));
    // Se conserva el orden elegido por el usuario, no el que devuelve la API.
    const entries = selected
        .map((code) => (entriesState.data ?? []).find((entry) => entry.provinceCode === code))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    return (
        <div className="page">
            <header className="page__header">
                <div>
                    <h1 className="page__title">Comparar provincias</h1>
                    <p className="page__subtitle">
                        Elige hasta {MAX_PROVINCES} provincias{periodState.period && <> · Datos del {formatQuarter(periodState.period)}</>}
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

            {provincesLoading || periodState.loading || (entriesState.loading && selected.length > 0) ? (
                <LoadingState slow={periodState.slow || entriesState.slow} label="Comparando" />
            ) : periodState.error || entriesState.error ? (
                <ErrorState message={(periodState.error ?? entriesState.error)!} onRetry={entriesState.reload} />
            ) : selected.length === 0 ? (
                <EmptyState title="Selecciona provincias para empezar" text="Busca arriba al menos dos provincias y verás sus índices lado a lado." />
            ) : entries.length === 0 ? (
                <EmptyState title="Sin datos para esta selección" text="Las provincias elegidas aún no tienen índices en el último trimestre." />
            ) : (
                <>
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
                                        <th scope="col">Precio</th>
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
                                            <td>{formatSigned(entry.priceTrendIndex)}</td>
                                            <td>{formatIndex(view === "historical" ? entry.activityIndex : entry.activityIndexNationalRanking)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}

            {selected.length > 0 && construction && (
                <>
                    <Card title={`Obra de vivienda · ${formatQuarter(construction.period)}`}>
                        <ConstructionCompareChart rows={construction.rows} />
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
                                    {construction.rows.map((row) => (
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