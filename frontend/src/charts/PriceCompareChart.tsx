import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice, formatQuarter } from "../utils/format";
import type { PriceComparisonPoint } from "../utils/market";
import { CHART_COLORS, axisProps, gridProps, tooltipProps } from "./chartTheme";

interface PriceCompareChartProps {
    data: PriceComparisonPoint[];
    provinceName: string | null;
    // Trimestre que muestra el mapa; se marca con una línea vertical.
    period: string;
}

// Precio por m² a lo largo del tiempo: mediana de las provincias y, si hay una elegida, su propia serie.
export function PriceCompareChart({ data, provinceName, period }: PriceCompareChartProps) {
    const rows = data.map((point) => ({ label: formatQuarter(point.period), national: point.national, province: point.province }));

    return (
        <div className="chart" role="img" aria-label="Evolución del precio por metro cuadrado frente a la mediana nacional">
            <ResponsiveContainer width="100%" height={280}>
                <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" {...axisProps} minTickGap={36} />
                    <YAxis {...axisProps} domain={["dataMin - 100", "dataMax + 100"]} tickFormatter={(value) => `${Math.round(value)}`} width={52} />
                    <Tooltip {...tooltipProps} formatter={(value) => formatPrice(typeof value === "number" ? value : null)} />
                    <ReferenceLine x={formatQuarter(period)} stroke="var(--color-text-muted)" strokeDasharray="4 4" />
                    <Line
                        type="monotone"
                        dataKey="national"
                        name="Mediana provincial"
                        stroke={CHART_COLORS[0]}
                        strokeWidth={provinceName ? 2 : 3}
                        dot={false}
                        activeDot={{ r: 5 }}
                        connectNulls
                        animationDuration={600}
                    />
                    {provinceName && (
                        <Line
                            type="monotone"
                            dataKey="province"
                            name={provinceName}
                            stroke={CHART_COLORS[1]}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 5 }}
                            connectNulls
                            animationDuration={600}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
            <ul className="chart__legend">
                <li><span className="chart__swatch" style={{ background: CHART_COLORS[0] }} />Mediana provincial</li>
                {provinceName && <li><span className="chart__swatch" style={{ background: CHART_COLORS[1] }} />{provinceName}</li>}
            </ul>
        </div>
    );
}
