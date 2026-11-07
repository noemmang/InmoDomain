import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ConstructionRecord, PropertySale } from "../api/types";
import { formatNumber, formatQuarter } from "../utils/format";
import { supplyDemand } from "../utils/market";
import { CHART_COLORS, axisProps, gridProps, tooltipProps } from "./chartTheme";

const SERIES = ["Compraventas", "Iniciadas", "Terminadas"] as const;

// Compraventas (INE) frente a viviendas iniciadas y terminadas (MIVAU, vía ISTAC) por trimestre: cuánta obra entra frente a lo que se vende.
export function SupplyDemandChart({ records, sales }: { records: ConstructionRecord[]; sales: PropertySale[] }) {
    const data = supplyDemand(records, sales)
        .filter((point) => point.started != null || point.completed != null)
        .slice(-40)
        .map((point) => ({
            label: formatQuarter(point.period),
            Compraventas: point.sales,
            Iniciadas: point.started,
            Terminadas: point.completed,
        }));

    return (
        <div className="chart" role="img" aria-label="Compraventas, viviendas iniciadas y viviendas terminadas por trimestre">
            <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" {...axisProps} minTickGap={32} />
                    <YAxis {...axisProps} width={68} tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip {...tooltipProps} formatter={(value) => formatNumber(Number(value))} />
                    {SERIES.map((name, index) => (
                        <Line
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={CHART_COLORS[index]}
                            strokeWidth={name === "Compraventas" ? 3 : 2}
                            dot={false}
                            activeDot={{ r: 5 }}
                            connectNulls
                            animationDuration={600}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
            <ul className="chart__legend">
                {SERIES.map((name, index) => (
                    <li key={name}><span className="chart__swatch" style={{ background: CHART_COLORS[index] }} />{name}</li>
                ))}
            </ul>
        </div>
    );
}