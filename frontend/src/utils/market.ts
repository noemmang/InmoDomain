import type { ConstructionRecord, Province, ProvinceAnalytics, PropertySale, ScorePeriod } from "../api/types";
import type { MapTone } from "../components/SpainMap";
import { SCORE_NAME } from "./brand";
import { formatDecimal } from "./format";

// Viviendas iniciadas y terminadas de un mes por régimen; una medida ausente (el ISTAC la deja vacía) queda sin definir.
export interface ConstructionMonth {
    startedFree?: number;
    startedProtected?: number;
    completedFree?: number;
    completedProtected?: number;
}

// Datos de una provincia ya indexados para el panel: índices y precio por trimestre, compraventas y obra por mes.
export interface ProvinceSeries {
    code: string;
    name: string;
    community: string;
    population: number;
    analytics: ProvinceAnalytics;
    scores: Map<string, ScorePeriod>;
    prices: Map<string, number>;
    sales: Map<string, { nueva: number; segunda: number }>;
    construction: Map<string, ConstructionMonth>;
}

// Valores de una provincia en un trimestre: índices del Analytics y cifras derivadas de los datos de origen.
export interface MarketRow {
    code: string;
    name: string;
    community: string;
    population: number;
    score: number | null;
    priceIndex: number | null;
    priceIndexNational: number | null;
    trend: number | null;
    trendYearly: number | null;
    activityIndex: number | null;
    activityIndexNational: number | null;
    price: number | null;
    priceChange: number | null;
    operations: number | null;
    operationsPrevious: number | null;
    operationsRate: number | null;
    newShare: number | null;
    // Obra del trimestre (MIVAU, vía ISTAC); null si falta algún mes de la medida.
    started: number | null;
    startedPrevious: number | null;
    startedProtected: number | null;
    startedChange: number | null;
    startedRate: number | null;
    completed: number | null;
    completedRate: number | null;
    protectedShare: number | null;
    supplyRatio: number | null;
}

export type MapMetric = "score" | "price" | "priceChange" | "operationsRate" | "newShare" | "startedRate" | "protectedShare" | "supplyRatio";

export interface MetricDefinition {
    key: MapMetric;
    // Las lecturas de obra van con un dato más atrasado que precio y compraventas.
    group: "market" | "construction";
    label: string;
    unit: string;
    description: string;
    decimals: number;
    signed: boolean;
    pick: (row: MarketRow) => number | null;
}

// Escala de cinco tramos con el mismo número de provincias cada uno; los umbrales alimentan la leyenda del mapa.
export interface MapScale {
    minimum: number;
    maximum: number;
    thresholds: number[];
    toneOf: (value: number | null) => MapTone;
}

export interface MarketSummary {
    medianPrice: number | null;
    medianPriceChange: number | null;
    operations: number | null;
    operationsRate: number | null;
    operationsChange: number | null;
}

export interface ConstructionSummary {
    started: number | null;
    startedRate: number | null;
    startedChange: number | null;
    completed: number | null;
    protectedShare: number | null;
    supplyRatio: number | null;
}

export interface SupplyDemandPoint {
    period: string;
    sales: number | null;
    started: number | null;
    completed: number | null;
}

export interface PriceComparisonPoint {
    period: string;
    national: number | null;
    province: number | null;
}

export interface CommunityValue {
    name: string;
    value: number;
    provinces: number;
}

const QUINTILES: MapTone[] = ["h1", "h2", "h3", "h4", "h5"];

// Lecturas que puede mostrar el mapa; el orden es el de las pestañas.
export const METRICS: MetricDefinition[] = [
    {
        key: "score",
        group: "market",
        label: SCORE_NAME,
        unit: "",
        description: "Nota de 0 a 100 que resume precio, tendencia y actividad de cada provincia.",
        decimals: 1,
        signed: false,
        pick: (row) => row.score,
    },
    {
        key: "price",
        group: "market",
        label: "Precio",
        unit: "€/m²",
        description: "Precio medio por metro cuadrado de la vivienda libre tasada (MIVAU).",
        decimals: 0,
        signed: false,
        pick: (row) => row.price,
    },
    {
        key: "priceChange",
        group: "market",
        label: "Variación anual",
        unit: "%",
        description: "Cambio del precio por m² frente al mismo trimestre del año anterior.",
        decimals: 1,
        signed: true,
        pick: (row) => row.priceChange,
    },
    {
        key: "operationsRate",
        group: "market",
        label: "Compraventas",
        unit: "por 1.000 hab.",
        description: "Compraventas de vivienda del trimestre (INE) por cada mil habitantes.",
        decimals: 1,
        signed: false,
        pick: (row) => row.operationsRate,
    },
    {
        key: "newShare",
        group: "market",
        label: "Vivienda nueva",
        unit: "%",
        description: "Parte de las compraventas del trimestre que corresponden a vivienda nueva.",
        decimals: 1,
        signed: false,
        pick: (row) => row.newShare,
    },
    {
        key: "startedRate",
        group: "construction",
        label: "Obra iniciada",
        unit: "por 10.000 hab.",
        description: "Viviendas cuya obra empieza en el trimestre, libres y protegidas, por cada 10.000 habitantes (MIVAU, vía ISTAC).",
        decimals: 1,
        signed: false,
        pick: (row) => row.startedRate,
    },
    {
        key: "protectedShare",
        group: "construction",
        label: "Obra protegida",
        unit: "%",
        description: "Parte de las viviendas iniciadas en el trimestre que son de protección oficial.",
        decimals: 1,
        signed: false,
        pick: (row) => row.protectedShare,
    },
    {
        key: "supplyRatio",
        group: "construction",
        label: "Obra y demanda",
        unit: "por 100 compraventas",
        description: "Viviendas iniciadas por cada 100 compraventas del trimestre: cuánta obra entra frente a lo que se vende.",
        decimals: 0,
        signed: false,
        pick: (row) => row.supplyRatio,
    },
];

export function metricOf(key: string | null): MetricDefinition {
    return METRICS.find((metric) => metric.key === key) ?? METRICS[0];
}

// Valor de una métrica con su unidad (o sin ella, para las leyendas).
export function formatMetric(definition: MetricDefinition, value: number | null | undefined, withUnit = true): string {
    if (value == null) return "—";
    const text = formatDecimal(value, definition.decimals, definition.signed);
    return withUnit && definition.unit ? `${text}\u00A0${definition.unit}` : text;
}

// Primer día del trimestre de una fecha mensual: "2026-05-01" -> "2026-04-01".
export function quarterOf(isoDate: string): string {
    const [year, month] = isoDate.split("-").map(Number);
    const first = Math.floor((month - 1) / 3) * 3 + 1;
    return `${year}-${String(first).padStart(2, "0")}-01`;
}

// Desplaza una fecha mensual el número de meses indicado (negativo, hacia atrás).
function shiftMonths(isoDate: string, months: number): string {
    const [year, month] = isoDate.split("-").map(Number);
    const index = year * 12 + (month - 1) + months;
    return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}-01`;
}

export function shiftQuarter(isoDate: string, quarters: number): string {
    return shiftMonths(isoDate, quarters * 3);
}

function isNumber(value: number | null | undefined): value is number {
    return value != null;
}

function sum(values: number[]): number {
    return values.reduce((total, value) => total + value, 0);
}

// Mediana de una lista de números; null si está vacía.
export function median(values: number[]): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// Valor de un cuantil con interpolación lineal sobre una lista ya ordenada.
function quantile(sorted: number[], fraction: number): number {
    const position = (sorted.length - 1) * fraction;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

// Indexa la ficha analítica de una provincia. El precio de un trimestre es la media de las dos antigüedades, igual que en Analytics.
export function buildSeries(province: Province, analytics: ProvinceAnalytics): ProvinceSeries {
    const scores = new Map(analytics.history.map((row) => [row.period, row]));

    const pricesByPeriod = new Map<string, number[]>();
    analytics.appraisedValues.forEach((value) => {
        pricesByPeriod.set(value.period, [...(pricesByPeriod.get(value.period) ?? []), value.pricePerSquareMeter]);
    });
    const prices = new Map([...pricesByPeriod].map(([period, values]) => [period, sum(values) / values.length]));

    const sales = new Map<string, { nueva: number; segunda: number }>();
    analytics.propertySales.forEach((sale) => {
        const entry = sales.get(sale.period) ?? { nueva: 0, segunda: 0 };
        if (sale.housingStatus === "nueva") entry.nueva += sale.operationsCount;
        else entry.segunda += sale.operationsCount;
        sales.set(sale.period, entry);
    });

    // Una ficha de un Analytics anterior a la obra no trae la serie: se trata como vacía.
    const construction = new Map<string, ConstructionMonth>();
    (analytics.construction ?? []).forEach((record) => {
        const month = construction.get(record.period) ?? {};
        const free = record.regime === "libre";
        if (record.phase === "iniciada") {
            if (free) month.startedFree = record.dwellingsCount;
            else month.startedProtected = record.dwellingsCount;
        } else if (free) month.completedFree = record.dwellingsCount;
        else month.completedProtected = record.dwellingsCount;
        construction.set(record.period, month);
    });

    return {
        code: province.provinceCode,
        name: province.name,
        community: province.autonomousCommunity,
        population: province.population,
        analytics,
        scores,
        prices,
        sales,
        construction,
    };
}

// Compraventas de un trimestre; null si falta algún mes (el INE publica mes a mes y el trimestre en curso es parcial).
function quarterSales(series: ProvinceSeries, period: string): { nueva: number; segunda: number } | null {
    let nueva = 0;
    let segunda = 0;
    for (let offset = 0; offset < 3; offset += 1) {
        const month = series.sales.get(shiftMonths(period, offset));
        if (!month) return null;
        nueva += month.nueva;
        segunda += month.segunda;
    }
    return { nueva, segunda };
}

// Suma una medida de obra de los tres meses de un trimestre; null si falta alguno.
function quarterTotal(series: ProvinceSeries, period: string, pick: (month: ConstructionMonth) => number | undefined): number | null {
    let total = 0;
    for (let offset = 0; offset < 3; offset += 1) {
        const value = pick(series.construction.get(shiftMonths(period, offset)) ?? {});
        if (value === undefined) return null;
        total += value;
    }
    return total;
}

// Obra de un trimestre: iniciadas y terminadas (libres más protegidas) y la parte protegida de las iniciadas.
function quarterConstruction(series: ProvinceSeries, period: string) {
    const startedFree = quarterTotal(series, period, (month) => month.startedFree);
    const startedProtected = quarterTotal(series, period, (month) => month.startedProtected);
    const completedFree = quarterTotal(series, period, (month) => month.completedFree);
    const completedProtected = quarterTotal(series, period, (month) => month.completedProtected);

    return {
        started: startedFree != null && startedProtected != null ? startedFree + startedProtected : null,
        startedProtected,
        completed: completedFree != null && completedProtected != null ? completedFree + completedProtected : null,
    };
}

// Último trimestre con las viviendas iniciadas completas en una provincia; null si no hay ninguno.
export function latestConstructionQuarter(series: ProvinceSeries): string | null {
    const quarters = [...new Set([...series.construction.keys()].map(quarterOf))].sort().reverse();
    return quarters.find((period) => quarterConstruction(series, period).started != null) ?? null;
}

// Valores de una provincia en el trimestre indicado.
export function computeRow(series: ProvinceSeries, period: string): MarketRow {
    const score = series.scores.get(period);
    const price = series.prices.get(period) ?? null;
    const previousPrice = series.prices.get(shiftQuarter(period, -4)) ?? null;
    const current = quarterSales(series, period);
    const previous = quarterSales(series, shiftQuarter(period, -4));
    const operations = current ? current.nueva + current.segunda : null;
    const construction = quarterConstruction(series, period);
    const startedPrevious = quarterConstruction(series, shiftQuarter(period, -4)).started;

    return {
        code: series.code,
        name: series.name,
        community: series.community,
        population: series.population,
        score: score?.score ?? null,
        priceIndex: score?.priceIndex ?? null,
        priceIndexNational: score?.priceIndexNationalRanking ?? null,
        trend: score?.priceTrendIndex ?? null,
        trendYearly: score?.priceTrendIndexYearOverYear ?? null,
        activityIndex: score?.activityIndex ?? null,
        activityIndexNational: score?.activityIndexNationalRanking ?? null,
        price,
        priceChange: price != null && previousPrice ? (price / previousPrice - 1) * 100 : null,
        operations,
        operationsPrevious: previous ? previous.nueva + previous.segunda : null,
        operationsRate: operations != null && series.population > 0 ? (operations / series.population) * 1000 : null,
        newShare: current && operations ? (current.nueva / operations) * 100 : null,
        started: construction.started,
        startedPrevious,
        startedProtected: construction.startedProtected,
        startedChange: construction.started != null && startedPrevious ? (construction.started / startedPrevious - 1) * 100 : null,
        startedRate: construction.started != null && series.population > 0 ? (construction.started / series.population) * 10000 : null,
        completed: construction.completed,
        completedRate: construction.completed != null && series.population > 0 ? (construction.completed / series.population) * 10000 : null,
        protectedShare: construction.started && construction.startedProtected != null ? (construction.startedProtected / construction.started) * 100 : null,
        supplyRatio: construction.started != null && operations ? (construction.started / operations) * 100 : null,
    };
}

// Trimestres con precio en al menos el 80 % de las provincias, de más antiguo a más reciente.
export function priceQuarters(all: ProvinceSeries[]): string[] {
    const counts = new Map<string, number>();
    all.forEach((series) => {
        series.prices.forEach((_price, period) => counts.set(period, (counts.get(period) ?? 0) + 1));
    });
    const minimum = Math.ceil(all.length * 0.8);
    return [...counts].filter(([, count]) => count >= minimum).map(([period]) => period).sort();
}

// Último trimestre con Índice en la mitad de las provincias; si ninguno lo tiene, el más reciente con precio.
export function defaultQuarter(all: ProvinceSeries[], quarters: string[]): string | null {
    const scored = [...quarters].reverse().find(
        (period) => all.filter((series) => series.scores.get(period)?.score != null).length >= all.length / 2,
    );
    return scored ?? quarters.at(-1) ?? null;
}

// Trimestres (de los dados) con las viviendas iniciadas completas en al menos el 80 % de las provincias.
export function constructionQuarters(all: ProvinceSeries[], quarters: string[]): string[] {
    const minimum = Math.ceil(all.length * 0.8);
    return quarters.filter((period) => all.filter((series) => quarterConstruction(series, period).started != null).length >= minimum);
}

// Escala por quintiles de una lista de valores; null si no hay al menos dos.
export function buildScale(values: number[]): MapScale | null {
    if (values.length < 2) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const thresholds = [1, 2, 3, 4].map((step) => quantile(sorted, step / 5));

    return {
        minimum: sorted[0],
        maximum: sorted[sorted.length - 1],
        thresholds,
        toneOf: (value) => (value == null ? "none" : QUINTILES[thresholds.filter((threshold) => value >= threshold).length]),
    };
}

// Tramos de la leyenda: un color y el rango de valores que cubre.
export function scaleRanges(scale: MapScale, definition: MetricDefinition): { tone: MapTone; label: string }[] {
    const edges = [scale.minimum, ...scale.thresholds, scale.maximum];
    return QUINTILES.map((tone, index) => ({
        tone,
        label: `${formatMetric(definition, edges[index], false)} a ${formatMetric(definition, edges[index + 1], false)}`,
    }));
}

// Cifras nacionales del trimestre: medianas provinciales y total de compraventas con su variación anual.
export function summarize(rows: MarketRow[]): MarketSummary {
    const withOperations = rows.filter((row) => row.operations != null);
    const comparable = withOperations.filter((row) => row.operationsPrevious != null);
    const previousTotal = sum(comparable.map((row) => row.operationsPrevious ?? 0));
    const operations = withOperations.length ? sum(withOperations.map((row) => row.operations ?? 0)) : null;
    const population = sum(withOperations.map((row) => row.population));

    return {
        medianPrice: median(rows.map((row) => row.price).filter(isNumber)),
        medianPriceChange: median(rows.map((row) => row.priceChange).filter(isNumber)),
        operations,
        operationsRate: operations != null && population > 0 ? (operations / population) * 1000 : null,
        operationsChange: previousTotal > 0 ? (sum(comparable.map((row) => row.operations ?? 0)) / previousTotal - 1) * 100 : null,
    };
}

// Cifras nacionales de obra del trimestre: totales provinciales, tasa por habitantes y variación anual.
export function summarizeConstruction(rows: MarketRow[]): ConstructionSummary {
    const withStarted = rows.filter((row) => row.started != null);
    const comparable = withStarted.filter((row) => row.startedPrevious != null);
    const previousTotal = sum(comparable.map((row) => row.startedPrevious ?? 0));
    const started = withStarted.length ? sum(withStarted.map((row) => row.started ?? 0)) : null;
    const population = sum(withStarted.map((row) => row.population));
    const withCompleted = rows.filter((row) => row.completed != null);
    const withDemand = withStarted.filter((row) => row.operations != null);
    const demandOperations = sum(withDemand.map((row) => row.operations ?? 0));

    return {
        started,
        startedRate: started != null && population > 0 ? (started / population) * 10000 : null,
        startedChange: previousTotal > 0 ? (sum(comparable.map((row) => row.started ?? 0)) / previousTotal - 1) * 100 : null,
        completed: withCompleted.length ? sum(withCompleted.map((row) => row.completed ?? 0)) : null,
        protectedShare: started ? (sum(withStarted.map((row) => row.startedProtected ?? 0)) / started) * 100 : null,
        supplyRatio: demandOperations > 0 ? (sum(withDemand.map((row) => row.started ?? 0)) / demandOperations) * 100 : null,
    };
}

// Compraventas, viviendas iniciadas y terminadas por trimestre; una medida queda en null si le falta algún mes.
export function supplyDemand(records: ConstructionRecord[], sales: PropertySale[]): SupplyDemandPoint[] {
    const addTo = (map: Map<string, number>, period: string, value: number) => map.set(period, (map.get(period) ?? 0) + value);
    const salesByMonth = new Map<string, number>();
    const startedByMonth = new Map<string, number>();
    const completedByMonth = new Map<string, number>();

    sales.forEach((sale) => addTo(salesByMonth, sale.period, sale.operationsCount));
    records.forEach((record) => addTo(record.phase === "iniciada" ? startedByMonth : completedByMonth, record.period, record.dwellingsCount));

    const quarterly = (byMonth: Map<string, number>, period: string): number | null => {
        const months = [0, 1, 2].map((offset) => byMonth.get(shiftMonths(period, offset)));
        return months.every((value) => value !== undefined) ? sum(months as number[]) : null;
    };

    const periods = new Set([...salesByMonth.keys(), ...startedByMonth.keys(), ...completedByMonth.keys()].map(quarterOf));

    return [...periods].sort().map((period) => ({
        period,
        sales: quarterly(salesByMonth, period),
        started: quarterly(startedByMonth, period),
        completed: quarterly(completedByMonth, period),
    }));
}

// Provincias con el valor más alto y más bajo de una métrica.
export function extremes(rows: MarketRow[], definition: MetricDefinition, count: number) {
    const ranked = rows
        .map((row) => ({ row, value: definition.pick(row) }))
        .filter((item): item is { row: MarketRow; value: number } => item.value != null)
        .sort((a, b) => b.value - a.value);

    return { highest: ranked.slice(0, count), lowest: ranked.slice(-count).reverse() };
}

// Posición de cada provincia en una métrica (1 = valor más alto).
export function rankOf(rows: MarketRow[], definition: MetricDefinition): Map<string, number> {
    const ranked = rows
        .map((row) => ({ code: row.code, value: definition.pick(row) }))
        .filter((item): item is { code: string; value: number } => item.value != null)
        .sort((a, b) => b.value - a.value);

    return new Map(ranked.map((item, index) => [item.code, index + 1]));
}

// Mediana de una métrica por comunidad autónoma, de mayor a menor.
export function groupByCommunity(rows: MarketRow[], definition: MetricDefinition): CommunityValue[] {
    const groups = new Map<string, number[]>();
    rows.forEach((row) => {
        const value = definition.pick(row);
        if (value != null) groups.set(row.community, [...(groups.get(row.community) ?? []), value]);
    });

    return [...groups]
        .map(([name, values]) => ({ name, value: median(values) ?? 0, provinces: values.length }))
        .sort((a, b) => b.value - a.value);
}

// Precio mediano nacional por trimestre junto al de la provincia elegida, si hay una.
export function priceComparison(all: ProvinceSeries[], quarters: string[], selected: ProvinceSeries | null): PriceComparisonPoint[] {
    return quarters.map((period) => ({
        period,
        national: median(all.map((series) => series.prices.get(period)).filter(isNumber)),
        province: selected?.prices.get(period) ?? null,
    }));
}
