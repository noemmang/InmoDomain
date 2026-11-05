import { SCORE_NAME } from "../utils/brand";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ActivityHeatmap } from "../charts/ActivityHeatmap";
import type { IndexView } from "../charts/EvolutionChart";
import { PriceActivityScatter, type ScatterPoint } from "../charts/PriceActivityScatter";
import { PriceCompareChart } from "../charts/PriceCompareChart";
import { SalesChart } from "../charts/SalesChart";
import { BarList } from "../components/BarList";
import { Card } from "../components/Card";
import { FavoriteButton } from "../components/FavoriteButton";
import { MapKey } from "../components/MapKey";
import { MarketLoading } from "../components/MarketLoading";
import { MarketMap } from "../components/MarketMap";
import { ProvincePanel } from "../components/ProvincePanel";
import { RankList } from "../components/RankList";
import { SegmentedControl } from "../components/SegmentedControl";
import type { MapTone } from "../components/SpainMap";
import { EmptyState, ErrorState } from "../components/StateViews";
import { TimeSlider } from "../components/TimeSlider";
import { useMarketData } from "../hooks/useMarketData";
import { formatDecimal, formatIndex, formatNumber, formatPercent, formatPrice, formatQuarter, formatSigned, scoreTone } from "../utils/format";
import {
    METRICS, buildScale, computeRow, defaultQuarter, extremes, formatMetric, groupByCommunity, metricOf, priceComparison,
    priceQuarters, rankOf, scaleRanges, summarize, type MarketRow,
} from "../utils/market";

type SortKey = "name" | "score" | "price" | "priceChange" | "operationsRate" | "newShare" | "priceIndex" | "trend" | "activityIndex";

const RANKING_SIZE = 5;

function isNumber(value: number | null): value is number {
    return value != null;
}

// Panel principal: mapa interactivo con selector de métrica y de trimestre, cifras nacionales, gráficos y tabla de las 52 provincias.
export function ExplorePage() {
    const market = useMarketData();
    const [params, setParams] = useSearchParams();
    const [chosenPeriod, setChosenPeriod] = useState<string | null>(null);
    const [view, setView] = useState<IndexView>("historical");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "score", direction: "desc" });
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    const asideRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    const { series } = market;
    const definition = metricOf(params.get("m"));
    const selectedCode = params.get("p");

    const quarters = useMemo(() => priceQuarters(series), [series]);
    const defaultPeriod = useMemo(() => defaultQuarter(series, quarters), [series, quarters]);
    const period = chosenPeriod && quarters.includes(chosenPeriod) ? chosenPeriod : defaultPeriod;

    const rows = useMemo(() => (period ? series.map((item) => computeRow(item, period)) : []), [series, period]);
    const scale = useMemo(() => buildScale(rows.map(definition.pick).filter(isNumber)), [rows, definition]);
    const summary = useMemo(() => summarize(rows), [rows]);
    const rankMap = useMemo(() => rankOf(rows, definition), [rows, definition]);
    const { highest, lowest } = useMemo(() => extremes(rows, definition, RANKING_SIZE), [rows, definition]);
    const communities = useMemo(() => groupByCommunity(rows, definition), [rows, definition]);

    const selectedRow = rows.find((row) => row.code === selectedCode) ?? null;
    const selectedSeries = series.find((item) => item.code === selectedCode) ?? null;

    const tones = useMemo(
        () => Object.fromEntries(rows.map((row): [string, MapTone] => [row.code, scale ? scale.toneOf(definition.pick(row)) : "none"])),
        [rows, scale, definition],
    );
    const labels = useMemo(
        () => Object.fromEntries(rows.map((row) => [row.code, `${row.name}: ${formatMetric(definition, definition.pick(row))}`])),
        [rows, definition],
    );

    const comparison = useMemo(() => priceComparison(series, quarters, selectedSeries), [series, quarters, selectedSeries]);
    const sales = useMemo(
        () => (selectedSeries ? selectedSeries.analytics.propertySales : series.flatMap((item) => item.analytics.propertySales)),
        [series, selectedSeries],
    );
    const scatterPoints: ScatterPoint[] = useMemo(
        () => rows.flatMap((row) => (row.price != null && row.operationsRate != null
            ? [{ code: row.code, name: row.name, price: row.price, rate: row.operationsRate, population: row.population }]
            : [])),
        [rows],
    );

    const priceIndexOf = (row: MarketRow) => (view === "historical" ? row.priceIndex : row.priceIndexNational);
    const activityIndexOf = (row: MarketRow) => (view === "historical" ? row.activityIndex : row.activityIndexNational);

    const visibleRows = useMemo(() => {
        const text = query.trim().toLowerCase();
        const value = (row: MarketRow): number | string => {
            switch (sort.key) {
                case "name": return row.name;
                case "score": return row.score ?? -Infinity;
                case "price": return row.price ?? -Infinity;
                case "priceChange": return row.priceChange ?? -Infinity;
                case "operationsRate": return row.operationsRate ?? -Infinity;
                case "newShare": return row.newShare ?? -Infinity;
                case "priceIndex": return (view === "historical" ? row.priceIndex : row.priceIndexNational) ?? -Infinity;
                case "trend": return row.trend ?? -Infinity;
                default: return (view === "historical" ? row.activityIndex : row.activityIndexNational) ?? -Infinity;
            }
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
    }, [rows, query, sort, view]);

    function updateParam(key: "m" | "p", value: string | null) {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next, { replace: true });
    }

    // Seleccionar la provincia ya seleccionada la deselecciona; en pantallas estrechas el resumen queda debajo del mapa y se enfoca.
    function toggleProvince(code: string) {
        updateParam("p", code === selectedCode ? null : code);
        if (code !== selectedCode && window.matchMedia("(max-width: 1024px)").matches) {
            window.requestAnimationFrame(() => asideRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
        }
    }

    // Filtra la tabla por una comunidad autónoma y la enseña.
    function filterByCommunity(name: string) {
        setQuery(query === name ? "" : name);
        tableRef.current?.scrollIntoView({ block: "start" });
    }

    function changeSort(key: SortKey) {
        setSort((current) => ({ key, direction: current.key === key && current.direction === "desc" ? "asc" : "desc" }));
    }

    if (market.error) {
        return <div className="page"><ErrorState message={market.error} onRetry={market.retry} /></div>;
    }
    if (market.loading) {
        return (
            <div className="page">
                <MarketLoading loaded={market.loaded} total={market.total} slow={market.slow} loadedCodes={series.map((item) => item.code)} />
            </div>
        );
    }
    if (series.length === 0) {
        return <div className="page"><ErrorState message="No se han podido cargar los datos de mercado." onRetry={market.retry} /></div>;
    }
    if (!period) {
        return (
            <div className="page">
                <EmptyState title="Aún no hay datos de mercado" text="Cuando el importador procese los datos del INE y el MIVAU aparecerán aquí." />
            </div>
        );
    }

    const quarter = formatQuarter(period);
    const priceChangeDefinition = metricOf("priceChange");
    const biggestRise = extremes(rows, priceChangeDefinition, 1);
    const bestScore = extremes(rows, metricOf("score"), 1).highest[0];
    const scoreValues = rows.map((row) => row.score).filter(isNumber);
    const averageScore = scoreValues.length ? scoreValues.reduce((total, value) => total + value, 0) / scoreValues.length : null;
    const scopeName = selectedRow?.name ?? "España";

    const header = (key: SortKey, label: string) => (
        <th scope="col" aria-sort={sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
            <button type="button" className="table__sort" onClick={() => changeSort(key)}>
                {label}
                {sort.key === key && (sort.direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
            </button>
        </th>
    );

    const rankItems = (items: typeof highest) => items.map((item) => ({
        code: item.row.code,
        name: item.row.name,
        value: formatMetric(definition, item.value),
    }));

    return (
        <div className="page">
            <header className="page__header">
                <div>
                    <h1 className="page__title">Mercado inmobiliario</h1>
                    <p className="page__subtitle">Datos del {quarter} · {series.length} provincias</p>
                </div>
                <SegmentedControl
                    label="Tipo de índice"
                    value={view}
                    onChange={setView}
                    options={[{ value: "historical", label: "Percentil histórico" }, { value: "national", label: "Ranking nacional" }]}
                />
            </header>

            {market.failed.length > 0 && (
                <p className="dashboard__notice" role="status">
                    No se han podido cargar {market.failed.length} {market.failed.length === 1 ? "provincia" : "provincias"}; las cifras nacionales
                    son parciales.
                    <button type="button" className="dashboard__notice-action" onClick={market.retry}>Reintentar</button>
                </p>
            )}

            <div className="stat-grid stat-grid--four">
                <Card className="stat">
                    <span className="stat__label">Precio mediano por m²</span>
                    <strong className="stat__value">{formatPrice(summary.medianPrice)}</strong>
                    <span className="stat__note">{formatPercent(summary.medianPriceChange, true)} frente al año anterior (mediana provincial)</span>
                </Card>
                <Card className="stat">
                    <span className="stat__label">Compraventas del trimestre</span>
                    <strong className="stat__value">{summary.operations == null ? "—" : formatNumber(summary.operations)}</strong>
                    <span className="stat__note">
                        {summary.operations == null
                            ? "el INE aún no ha publicado el trimestre completo"
                            : `${formatDecimal(summary.operationsRate)} por 1.000 hab.${summary.operationsChange != null ? ` · ${formatPercent(summary.operationsChange, true)} anual` : ""}`}
                    </span>
                </Card>
                <Card className="stat">
                    <span className="stat__label">Mayor subida anual del precio</span>
                    <strong className="stat__value">{biggestRise.highest[0]?.row.name ?? "—"}</strong>
                    <span className="stat__note">
                        {biggestRise.highest[0] ? `${formatPercent(biggestRise.highest[0].value, true)} · mayor caída: ${biggestRise.lowest[0].row.name} ${formatPercent(biggestRise.lowest[0].value, true)}` : "sin trimestre de comparación"}
                    </span>
                </Card>
                <Card className="stat">
                    <span className="stat__label">Mejor {SCORE_NAME}</span>
                    <strong className="stat__value">{bestScore?.row.name ?? "—"}</strong>
                    <span className="stat__note">
                        {bestScore ? `${formatIndex(bestScore.value)} sobre 100 · media provincial ${formatIndex(averageScore)}` : "sin índices calculados en este trimestre"}
                    </span>
                </Card>
            </div>

            <div className="dashboard">
                <Card className="dashboard__map" title="Mapa del mercado">
                    <div className="dashboard__metrics">
                        <SegmentedControl
                            label="Lectura del mapa"
                            value={definition.key}
                            onChange={(key) => updateParam("m", key)}
                            options={METRICS.map((metric) => ({ value: metric.key, label: metric.label }))}
                        />
                    </div>
                    <p className="dashboard__description">{definition.description}</p>
                    <TimeSlider periods={quarters} value={period} onChange={setChosenPeriod} />
                    <MarketMap
                        rows={rows}
                        tones={tones}
                        labels={labels}
                        selected={selectedCode}
                        highlighted={hoveredRow}
                        onSelect={toggleProvince}
                        label={`Mapa de España coloreado por ${definition.label.toLowerCase()} en el ${quarter}`}
                        emptyMessage={scale ? null : `Sin datos de ${definition.label.toLowerCase()} en el ${quarter}. Prueba con otro trimestre.`}
                    />
                    {scale && <MapKey title={definition.unit ? `${definition.label} (${definition.unit})` : definition.label} items={scaleRanges(scale, definition)} />}
                </Card>

                <div className="dashboard__aside" ref={asideRef}>
                    {selectedRow ? (
                        <ProvincePanel
                            row={selectedRow}
                            period={period}
                            metric={definition.key}
                            rank={rankMap.get(selectedRow.code) ?? null}
                            ranked={rankMap.size}
                            medianPrice={summary.medianPrice}
                            onClose={() => updateParam("p", null)}
                        />
                    ) : (
                        <Card className="dashboard__hint">
                            <p className="state__title">Elige una provincia</p>
                            <p className="state__text">Pulsa una provincia del mapa para ver su resumen y compararla con el resto de España.</p>
                        </Card>
                    )}
                    <Card>
                        <RankList title="Valores más altos" items={rankItems(highest)} selected={selectedCode} onSelect={toggleProvince} />
                        <RankList title="Valores más bajos" items={rankItems(lowest)} selected={selectedCode} onSelect={toggleProvince} />
                    </Card>
                </div>
            </div>

            <div className="grid-two grid-two--even">
                <Card title={`Precio por m² · ${selectedRow ? `${scopeName} frente a España` : "mediana provincial"}`}>
                    <PriceCompareChart data={comparison} provinceName={selectedRow?.name ?? null} period={period} />
                </Card>
                <Card title={`Compraventas mensuales · ${scopeName}`}>
                    {sales.length > 0 ? <SalesChart sales={sales} /> : <EmptyState title="Sin compraventas" text="El INE no ha publicado datos para esta selección." />}
                </Card>
            </div>

            <div className="grid-two grid-two--even">
                <Card title={`Precio y actividad por provincia · ${quarter}`}>
                    {scatterPoints.length > 0 ? (
                        <>
                            <PriceActivityScatter points={scatterPoints} selected={selectedCode} onSelect={toggleProvince} />
                            <p className="chart__note">Cada punto es una provincia; su tamaño refleja la población. Pulsa uno para ver su resumen.</p>
                        </>
                    ) : (
                        <EmptyState title="Sin datos" text="Este trimestre no tiene a la vez precio y compraventas completas." />
                    )}
                </Card>
                <Card title={`${definition.label} por comunidad autónoma`}>
                    {communities.length > 0 ? (
                        <>
                            <BarList
                                items={communities.map((community) => ({
                                    key: community.name,
                                    label: community.name,
                                    value: community.value,
                                    display: formatMetric(definition, community.value),
                                    note: community.provinces > 1 ? `${community.provinces} prov.` : undefined,
                                }))}
                                activeKey={query}
                                onSelect={filterByCommunity}
                            />
                            <p className="chart__note">Mediana de sus provincias. Pulsa una comunidad para filtrar la tabla.</p>
                        </>
                    ) : (
                        <EmptyState title="Sin datos" text={`No hay ${definition.label.toLowerCase()} calculado en el ${quarter}.`} />
                    )}
                </Card>
            </div>

            {sales.length > 0 && (
                <Card title={`Estacionalidad de las compraventas · ${scopeName}`}>
                    <ActivityHeatmap sales={sales} />
                </Card>
            )}

            <div ref={tableRef}>
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
                                    {header("price", "Precio €/m²")}
                                    {header("priceChange", "Var. anual")}
                                    {header("operationsRate", "Compraventas /1.000 hab.")}
                                    {header("newShare", "Vivienda nueva")}
                                    {header("priceIndex", "Índ. precio")}
                                    {header("trend", "Tendencia")}
                                    {header("activityIndex", "Índ. actividad")}
                                    <th scope="col"><span className="visually-hidden">Favorito</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRows.map((row) => (
                                    <tr
                                        key={row.code}
                                        className={row.code === selectedCode ? "table__row--selected" : undefined}
                                        onMouseEnter={() => setHoveredRow(row.code)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        <td>
                                            <Link className="table__province" to={`/provincia/${row.code}`}>
                                                <strong>{row.name}</strong>
                                                <small>{row.community}</small>
                                            </Link>
                                        </td>
                                        <td><span className={`score-pill score-pill--${scoreTone(row.score)}`}>{formatIndex(row.score)}</span></td>
                                        <td>{row.price == null ? "—" : formatNumber(Math.round(row.price))}</td>
                                        <td className={(row.priceChange ?? 0) < 0 ? "text-negative" : "text-positive"}>{formatPercent(row.priceChange, true)}</td>
                                        <td>{formatDecimal(row.operationsRate)}</td>
                                        <td>{formatPercent(row.newShare)}</td>
                                        <td>{formatIndex(priceIndexOf(row))}</td>
                                        <td className={(row.trend ?? 0) < 0 ? "text-negative" : "text-positive"}>{formatSigned(row.trend)}</td>
                                        <td>{formatIndex(activityIndexOf(row))}</td>
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
