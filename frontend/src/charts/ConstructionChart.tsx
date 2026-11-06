import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ConstructionPhase, ConstructionRecord } from "../api/types";
import { formatMonth, formatNumber } from "../utils/format";
import { CHART_COLORS, axisProps, gridProps, tooltipProps } from "./chartTheme";

// Viviendas iniciadas o terminadas por mes, apiladas por régimen (libre o protegida), con los últimos 36 meses con dato.
export function ConstructionChart({ records, phase }: { records: ConstructionRecord[]; phase: ConstructionPhase }) {
    const byPeriod = new Map<string, { libre: number; protegida: number }>();
    records
        .filter((record) => record.phase === phase)
        .forEach((record) => {
            const entry = byPeriod.get(record.period) ?? { libre: 0, protegida: 0 };
            if (record.regime === "libre") entry.libre += record.dwellingsCount;
            else entry.protegida += record.dwellingsCount;
            byPeriod.set(record.period, entry);
        });

    const data = [...byPeriod.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-36)
        .map(([period, entry]) => ({ label: formatMonth(period), Libre: entry.libre, Protegida: entry.protegida }));

    return (
        <div className="chart" role="img" aria-label={`Viviendas ${phase === "iniciada" ? "iniciadas" : "terminadas"} por mes, libres y protegidas`}>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                    <YAxis {...axisProps} tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip {...tooltipProps} formatter={(value) => formatNumber(Number(value))} />
                    <Bar dataKey="Libre" stackId="construction" fill={CHART_COLORS[0]} animationDuration={600} />
                    <Bar dataKey="Protegida" stackId="construction" fill={CHART_COLORS[2]} radius={[8, 8, 0, 0]} animationDuration={600} />
                </BarChart>
            </ResponsiveContainer>
            <ul className="chart__legend">
                <li><span className="chart__swatch" style={{ background: CHART_COLORS[0] }} />Libre</li>
                <li><span className="chart__swatch" style={{ background: CHART_COLORS[2] }} />Protegida</li>
            </ul>
        </div>
    );
}
