import type { Province, ProvinceAnalytics, ScorePeriod } from "../api/types";
import type { MapTone } from "../components/SpainMap";
import { SCORE_NAME } from "./brand";
import { formatDecimal } from "./format";

// Datos de una provincia ya indexados para el panel: índices y precio por trimestre, compraventas por mes.
export interface ProvinceSeries {
    code: string;
    name: string;
    community: string;
    population: number;
    analytics: ProvinceAnalytics;
    scores: Map<string, ScorePeriod>;
    prices: Map<string, number>;
    sales: Map<string, { nueva: number; segunda: number }>;
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
}

export type MapMetric = "score" | "price" | "priceChange" | "operationsRate" | "newShare";

export interface MetricDefinition {
    key: MapMetric;
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
        label: SCORE_NAME,
        unit: "",
        description: "Nota de 0 a 100 que resume precio, tendencia y actividad de cada provincia.",
        decimals: 1,
        signed: false,
        pick: (row) => row.score,
    },
    {
        key: "price",
        label: "Precio",
        unit: "€/m²",
        description: "Precio medio por metro cuadrado de la vivienda libre tasada (MIVAU).",
        decimals: 0,
        signed: false,
        pick: (row) => row.price,
    },
    {
        key: "priceChange",
        label: "Variación anual",
        unit: "%",
        description: "Cambio del precio por m² frente al mismo trimestre del año anterior.",
        decimals: 1,
        signed: true,
        pick: (row) => row.priceChange,
    },
    {
        key: "operationsRate",
        label: "Compraventas",
        unit: "por 1.000 hab.",
        description: "Compraventas de vivienda del trimestre (INE) por cada mil habitantes.",
        decimals: 1,
        signed: false,
        pick: (row) => row.operationsRate,
    },
    {
        key: "newShare",
        label: "Vivienda nueva",
        unit: "%",
        description: "Parte de las compraventas del trimestre que corresponden a vivienda nueva.",
        decimals: 1,
        signed: false,
        pick: (row) => row.newShare,
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

    return {
        code: province.provinceCode,
        name: province.name,
        community: province.autonomousCommunity,
        population: province.population,
        analytics,
        scores,
        prices,
        sales,
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

// Valores de una provincia en el trimestre indicado.
export function computeRow(series: ProvinceSeries, period: string): MarketRow {
    const score = series.scores.get(period);
    const price = series.prices.get(period) ?? null;
    const previousPrice = series.prices.get(shiftQuarter(period, -4)) ?? null;
    const current = quarterSales(series, period);
    const previous = quarterSales(series, shiftQuarter(period, -4));
    const operations = current ? current.nueva + current.segunda : null;

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
