import { SCORE_NAME } from "../utils/brand";
import type { ConstructionPhase } from "../api/types";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ActivityHeatmap } from "../charts/ActivityHeatmap";
import { ConstructionChart } from "../charts/ConstructionChart";
import { PriceActivityScatter, type ScatterPoint } from "../charts/PriceActivityScatter";
import { PriceCompareChart } from "../charts/PriceCompareChart";
import { SalesChart } from "../charts/SalesChart";
import { SupplyDemandChart } from "../charts/SupplyDemandChart";
import { BarList } from "../components/BarList";
import { Card } from "../components/Card";
import { FavoriteButton } from "../components/FavoriteButton";
import { MapKey } from "../components/MapKey";
import { MarketLoading } from "../components/MarketLoading";
import { MarketMap } from "../components/MarketMap";
import { Masonry } from "../components/Masonry";
import { ProvincePanel } from "../components/ProvincePanel";
import { RankList } from "../components/RankList";
import { SegmentedControl } from "../components/SegmentedControl";
import type { MapTone } from "../components/SpainMap";
import { EmptyState, ErrorState } from "../components/StateViews";
import { TimeSlider } from "../components/TimeSlider";
import { useMarketData } from "../hooks/useMarketData";
import { formatDecimal, formatIndex, formatNumber, formatPercent, formatPrice, formatQuarter, formatSigned, scoreTone } from "../utils/format";
import {
    METRICS, buildScale, computeRow, constructionQuarters, defaultQuarter, extremes, formatMetric, groupByCommunity, metricOf,
    priceComparison, priceQuarters, rankOf, scaleRanges, summarize, summarizeConstruction, type MarketRow,
} from "../utils/market";

type SortKey =
    | "name" | "score" | "price" | "priceChange" | "operationsRate" | "newShare" | "startedRate" | "protectedShare"
    | "priceIndex" | "trend" | "activityIndex";

const RANKING_SIZE = 5;

function isNumber(value: number | null): value is number {
    return value != null;
}

// Panel principal: mapa interactivo con selector de métrica y de trimestre, cifras nacionales de mercado y de obra, gráficos y tabla de las 52 provincias.
export function ExplorePage() {
    const market = useMarketData();
    const [params, setParams] = useSearchParams();
    const [chosenPeriod, setChosenPeriod] = useState<string | null>(null);
    const [phase, setPhase] = useState<ConstructionPhase>("iniciada");
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
    // La obra llega con más retraso que el precio: sin trimestre elegido, sus lecturas del mapa abren en el último con dato.
    const constructionPeriods = useMemo(() => constructionQuarters(series, quarters), [series, quarters]);
    const preferredPeriod = definition.group === "construction" ? constructionPeriods.at(-1) ?? null : null;
    const period = chosenPeriod && quarters.includes(chosenPeriod) ? chosenPeriod : preferredPeriod ?? defaultPeriod;

    // Trimestre de las cifras de obra: el elegido si ya tiene dato y, si no, el último anterior con dato.
    const constructionPeriod = period
        ? (constructionPeriods.includes(period) ? period : constructionPeriods.filter((item) => item <= period).at(-1) ?? constructionPeriods.at(-1) ?? null)
        : null;

    const rows = useMemo(() => (period ? series.map((item) => computeRow(item, period)) : []), [series, period]);
    const constructionRows = useMemo(
        () => (constructionPeriod && constructionPeriod !== period ? series.map((item) => computeRow(item, constructionPeriod)) : rows),
        [series, constructionPeriod, period, rows],
    );
    const constructionByCode = useMemo(() => new Map(constructionRows.map((row) => [row.code, row])), [constructionRows]);
    const constructionSummary = useMemo(() => summarizeConstruction(constructionRows), [constructionRows]);
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
    const construction = useMemo(
        () => (selectedSeries ? selectedSeries.analytics.construction ?? [] : series.flatMap((item) => item.analytics.construction ?? [])),
        [series, selectedSeries],
    );
    const scatterPoints: ScatterPoint[] = useMemo(
        () => rows.flatMap((row) => (row.price != null && row.operationsRate != null
            ? [{ code: row.code, name: row.name, price: row.price, rate: row.operationsRate, population: row.population }]
            : [])),
        [rows],
    );

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
                case "startedRate": return constructionByCode.get(row.code)?.startedRate ?? -Infinity;
                case "protectedShare": return constructionByCode.get(row.code)?.protectedShare ?? -Infinity;
                case "priceIndex": return row.priceIndex ?? -Infinity;
                case "trend": return row.trend ?? -Infinity;
                default: return row.activityIndex ?? -Infinity;
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
    }, [rows, query, sort, constructionByCode]);

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
                <EmptyState title="Aún no hay datos de mercado" text="Cuando el importador procese los datos del INE, el MIVAU y el ISTAC aparecerán aquí." />
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

    // La etiqueta es la abreviada; el nombre completo queda en el atributo title.
    const header = (key: SortKey, label: string, title?: string) => (
        <th scope="col" aria-sort={sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
            <button type="button" className="table__sort" title={title} onClick={() => changeSort(key)}>
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

            {constructionPeriod && constructionSummary.started != null && (
                <div className="stat-grid stat-grid--four">
                    <Card className="stat">
                        <span className="stat__label">Viviendas iniciadas · {formatQuarter(constructionPeriod)}</span>
                        <strong className="stat__value">{formatNumber(constructionSummary.started)}</strong>
                        <span className="stat__note">
                            {formatDecimal(constructionSummary.startedRate)} por 10.000 hab.
                            {constructionSummary.startedChange != null ? ` · ${formatPercent(constructionSummary.startedChange, true)} anual` : ""}
                        </span>
                    </Card>
                    <Card className="stat">
                        <span className="stat__label">Obra protegida</span>
                        <strong className="stat__value">{formatPercent(constructionSummary.protectedShare)}</strong>
                        <span className="stat__note">de las viviendas iniciadas son de protección oficial</span>
                    </Card>
                    <Card className="stat">
                        <span className="stat__label">Viviendas terminadas</span>
                        <strong className="stat__value">{constructionSummary.completed == null ? "—" : formatNumber(constructionSummary.completed)}</strong>
                        <span className="stat__note">en el trimestre, libres y protegidas</span>
                    </Card>
                    <Card className="stat">
                        <span className="stat__label">Obra frente a demanda</span>
                        <strong className="stat__value">{constructionSummary.supplyRatio == null ? "—" : `${formatDecimal(constructionSummary.supplyRatio, 0)} por 100`}</strong>
                        <span className="stat__note">viviendas iniciadas por cada 100 compraventas</span>
                    </Card>
                </div>
            )}

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
                    {selectedRow && (
                        <ProvincePanel
                            row={selectedRow}
                            period={period}
                            metric={definition.key}
                            rank={rankMap.get(selectedRow.code) ?? null}
                            ranked={rankMap.size}
                            medianPrice={summary.medianPrice}
                            construction={constructionByCode.get(selectedRow.code) ?? null}
                            constructionPeriod={constructionPeriod}
                            onClose={() => updateParam("p", null)}
                        />
                    )}
                    <Card>
                        <RankList title="Valores más altos" items={rankItems(highest)} selected={selectedCode} onSelect={toggleProvince} />
                        <RankList title="Valores más bajos" items={rankItems(lowest)} selected={selectedCode} onSelect={toggleProvince} />
                    </Card>
                </div>
            </div>

            <Masonry>
                <Card title={`Precio por m² · ${selectedRow ? `${scopeName} frente a España` : "mediana provincial"}`}>
                    <PriceCompareChart data={comparison} provinceName={selectedRow?.name ?? null} period={period} />
                </Card>
                <Card title={`Compraventas mensuales · ${scopeName}`}>
                    {sales.length > 0 ? <SalesChart sales={sales} /> : <EmptyState title="Sin compraventas" text="El INE no ha publicado datos para esta selección." />}
                </Card>
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
                <Card
                    title={`Viviendas ${phase === "iniciada" ? "iniciadas" : "terminadas"} por mes · ${scopeName}`}
                    action={
                        <SegmentedControl
                            label="Fase de la obra"
                            value={phase}
                            onChange={setPhase}
                            options={[{ value: "iniciada", label: "Iniciadas" }, { value: "terminada", label: "Terminadas" }]}
                        />
                    }
                >
                    {construction.length > 0 ? (
                        <>
                            <ConstructionChart records={construction} phase={phase} />
                            <p className="chart__note">Libre es una estimación; protegida son calificaciones. Las cifras recientes son provisionales (MIVAU, vía ISTAC).</p>
                        </>
                    ) : (
                        <EmptyState title="Sin obra" text="El ISTAC no ha publicado datos de construcción para esta selección." />
                    )}
                </Card>
                <Card title={`Obra frente a compraventas · ${scopeName}`}>
                    {construction.length > 0 ? (
                        <>
                            <SupplyDemandChart records={construction} sales={sales} />
                            <p className="chart__note">Totales trimestrales: compraventas del INE frente a viviendas iniciadas y terminadas.</p>
                        </>
                    ) : (
                        <EmptyState title="Sin obra" text="El ISTAC no ha publicado datos de construcción para esta selección." />
                    )}
                </Card>
            </Masonry>

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
                        <table className="table table--compact">
                            <thead>
                                <tr>
                                    {header("name", "Provincia")}
                                    {header("score", "Índice")}
                                    {header("price", "€/m²", "Precio medio por metro cuadrado")}
                                    {header("priceChange", "Var. anual")}
                                    {header("operationsRate", "Ventas /1.000", "Compraventas por 1.000 habitantes")}
                                    {header("newShare", "Nueva", "Vivienda nueva sobre el total de compraventas")}
                                    {header("startedRate", "Obra /10.000", "Viviendas iniciadas por 10.000 habitantes")}
                                    {header("protectedShare", "Protegida", "Obra protegida sobre las viviendas iniciadas")}
                                    {header("priceIndex", "Índ. precio", "Índice de precio")}
                                    {header("trend", "Tendencia")}
                                    {header("activityIndex", "Índ. activ.", "Índice de actividad")}
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
                                        <td>{formatDecimal(constructionByCode.get(row.code)?.startedRate)}</td>
                                        <td>{formatPercent(constructionByCode.get(row.code)?.protectedShare)}</td>
                                        <td>{formatIndex(row.priceIndex)}</td>
                                        <td className={(row.trend ?? 0) < 0 ? "text-negative" : "text-positive"}>{formatSigned(row.trend)}</td>
                                        <td>{formatIndex(row.activityIndex)}</td>
                                        <td><FavoriteButton provinceCode={row.code} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="chart__note table__note">
                        Ventas: compraventas por 1.000 habitantes. Obra: viviendas iniciadas por 10.000 habitantes.
                        {constructionPeriod && <> La obra corresponde al {formatQuarter(constructionPeriod)}, el último trimestre con dato del MIVAU (vía ISTAC).</>}
                    </p>
                </Card>
            </div>
        </div>
    );
}