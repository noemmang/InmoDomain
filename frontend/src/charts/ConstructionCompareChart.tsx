import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDecimal } from "../utils/format";
import type { MarketRow } from "../utils/market";
import { CHART_COLORS, axisProps, gridProps, tooltipProps } from "./chartTheme";

// Barras agrupadas: cada grupo es una fase de la obra (por 10.000 habitantes) y cada barra una provincia comparada.
export function ConstructionCompareChart({ rows }: { rows: MarketRow[] }) {
    const metrics = [
        { label: "Iniciadas", pick: (row: MarketRow) => row.startedRate },
        { label: "Terminadas", pick: (row: MarketRow) => row.completedRate },
    ];

    const data = metrics.map((metric) => {
        const entry: Record<string, string | number | null> = { metric: metric.label };
        rows.forEach((row) => {
            entry[row.name] = metric.pick(row);
        });
        return entry;
    });

    return (
        <div className="chart" role="img" aria-label="Viviendas iniciadas y terminadas por 10.000 habitantes en cada provincia">
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barGap={6}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="metric" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip {...tooltipProps} formatter={(value) => `${formatDecimal(typeof value === "number" ? value : null)} por 10.000 hab.`} />
                    {rows.map((row, index) => (
                        <Bar key={row.code} dataKey={row.name} fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[8, 8, 0, 0]} animationDuration={600} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
            <ul className="chart__legend">
                {rows.map((row, index) => (
                    <li key={row.code}>
                        <span className="chart__swatch" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                        {row.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
