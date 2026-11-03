import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AppraisedValue } from "../api/types";
import { formatPrice, formatQuarter } from "../utils/format";
import { axisProps, gridProps, tooltipProps } from "./chartTheme";

// Precio medio por m² a lo largo del tiempo: media de las dos antigüedades de vivienda publicadas por el MIVAU.
export function PriceChart({ values }: { values: AppraisedValue[] }) {
    const byPeriod = new Map<string, number[]>();
    values.forEach((value) => {
        byPeriod.set(value.period, [...(byPeriod.get(value.period) ?? []), value.pricePerSquareMeter]);
    });

    const data = [...byPeriod.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, prices]) => ({
            label: formatQuarter(period),
            price: prices.reduce((sum, price) => sum + price, 0) / prices.length,
        }));

    return (
        <div className="chart" role="img" aria-label="Evolución del precio medio por metro cuadrado">
            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="label" {...axisProps} minTickGap={32} />
                    <YAxis {...axisProps} domain={["dataMin - 100", "dataMax + 100"]} tickFormatter={(value) => `${Math.round(value)}`} width={52} />
                    <Tooltip {...tooltipProps} formatter={(value) => formatPrice(typeof value === "number" ? value : null)} />
                    <Area
                        type="monotone"
                        dataKey="price"
                        name="Precio"
                        stroke="var(--color-chart-2)"
                        strokeWidth={3}
                        fill="var(--color-chart-2)"
                        fillOpacity={0.14}
                        animationDuration={600}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}