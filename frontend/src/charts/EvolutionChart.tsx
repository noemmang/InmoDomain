import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ScorePeriod } from "../api/types";
import { formatIndex, formatQuarter } from "../utils/format";
import { CHART_COLORS, axisProps, gridProps, tooltipProps } from "./chartTheme";

export type IndexView = "historical" | "national";
export type TrendView = "quarterly" | "yearly";

interface EvolutionChartProps {
    history: ScorePeriod[];
    indexView: IndexView;
    trendView: TrendView;
}

// Evolución trimestral de los índices de una provincia. La vista decide qué variante de cada índice se dibuja.
export function EvolutionChart({ history, indexView, trendView }: EvolutionChartProps) {
    const data = [...history]
        .sort((a, b) => a.period.localeCompare(b.period))
        .map((row) => ({
            label: formatQuarter(row.period),
            "Índice": row.score,
            Precio: indexView === "historical" ? row.priceIndex : row.priceIndexNationalRanking,
            Actividad: indexView === "historical" ? row.activityIndex : row.activityIndexNationalRanking,
            Tendencia: trendView === "quarterly" ? row.priceTrendIndex : row.priceTrendIndexYearOverYear,
        }));

    const series = ["Índice", "Precio", "Actividad", "Tendencia"];

    return (
        <div className="chart" role="img" aria-label="Evolución trimestral de los índices de la provincia">
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip {...tooltipProps} formatter={(value) => formatIndex(typeof value === "number" ? value : null)} />
                    {series.map((name, index) => (
                        <Line
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={CHART_COLORS[index]}
                            strokeWidth={name === "Índice" ? 3 : 2}
                            dot={{ r: 3, fill: CHART_COLORS[index], strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                            connectNulls
                            animationDuration={600}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
            <ul className="chart__legend">
                {series.map((name, index) => (
                    <li key={name}>
                        <span className="chart__swatch" style={{ background: CHART_COLORS[index] }} />
                        {name}
                    </li>
                ))}
            </ul>
        </div>
    );
}