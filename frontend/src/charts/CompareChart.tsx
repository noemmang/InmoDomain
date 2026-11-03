import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CompareEntry } from "../api/types";
import { formatIndex } from "../utils/format";
import { CHART_COLORS, axisProps, gridProps, tooltipProps } from "./chartTheme";

interface CompareChartProps {
    entries: CompareEntry[];
    names: Map<string, string>;
    indexView: "historical" | "national";
}

// Barras agrupadas: cada grupo es un índice y cada barra una provincia comparada.
export function CompareChart({ entries, names, indexView }: CompareChartProps) {
    const metrics = [
        { label: "Score", pick: (entry: CompareEntry) => entry.score },
        { label: "Precio", pick: (entry: CompareEntry) => (indexView === "historical" ? entry.priceIndex : entry.priceIndexNationalRanking) },
        { label: "Actividad", pick: (entry: CompareEntry) => (indexView === "historical" ? entry.activityIndex : entry.activityIndexNationalRanking) },
    ];

    const data = metrics.map((metric) => {
        const row: Record<string, string | number | null> = { metric: metric.label };
        entries.forEach((entry) => {
            row[names.get(entry.provinceCode) ?? entry.provinceCode] = metric.pick(entry);
        });
        return row;
    });

    return (
        <div className="chart" role="img" aria-label="Comparación de índices entre provincias">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barGap={6}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="metric" {...axisProps} />
                    <YAxis {...axisProps} domain={[0, 100]} />
                    <Tooltip {...tooltipProps} formatter={(value) => formatIndex(typeof value === "number" ? value : null)} />
                    {entries.map((entry, index) => (
                        <Bar
                            key={entry.provinceCode}
                            dataKey={names.get(entry.provinceCode) ?? entry.provinceCode}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                            radius={[8, 8, 0, 0]}
                            animationDuration={600}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
            <ul className="chart__legend">
                {entries.map((entry, index) => (
                    <li key={entry.provinceCode}>
                        <span className="chart__swatch" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                        {names.get(entry.provinceCode) ?? entry.provinceCode}
                    </li>
                ))}
            </ul>
        </div>
    );
}