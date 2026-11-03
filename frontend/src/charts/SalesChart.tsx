import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PropertySale } from "../api/types";
import { formatMonth, formatNumber } from "../utils/format";
import { CHART_COLORS, axisProps, gridProps, tooltipProps } from "./chartTheme";

// Compraventas mensuales apiladas por estado de la vivienda (nueva o segunda mano), con los últimos meses disponibles.
export function SalesChart({ sales }: { sales: PropertySale[] }) {
    const byPeriod = new Map<string, { nueva: number; segunda: number }>();
    sales.forEach((sale) => {
        const entry = byPeriod.get(sale.period) ?? { nueva: 0, segunda: 0 };
        if (sale.housingStatus === "nueva") entry.nueva += sale.operationsCount;
        else entry.segunda += sale.operationsCount;
        byPeriod.set(sale.period, entry);
    });

    const data = [...byPeriod.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-24)
        .map(([period, entry]) => ({ label: formatMonth(period), Nueva: entry.nueva, "Segunda mano": entry.segunda }));

    return (
        <div className="chart" role="img" aria-label="Compraventas mensuales de vivienda nueva y de segunda mano">
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                    <YAxis {...axisProps} tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip {...tooltipProps} formatter={(value) => formatNumber(Number(value))} />
                    <Bar dataKey="Segunda mano" stackId="sales" fill={CHART_COLORS[0]} animationDuration={600} />
                    <Bar dataKey="Nueva" stackId="sales" fill={CHART_COLORS[1]} radius={[8, 8, 0, 0]} animationDuration={600} />
                </BarChart>
            </ResponsiveContainer>
            <ul className="chart__legend">
                <li><span className="chart__swatch" style={{ background: CHART_COLORS[0] }} />Segunda mano</li>
                <li><span className="chart__swatch" style={{ background: CHART_COLORS[1] }} />Nueva</li>
            </ul>
        </div>
    );
}