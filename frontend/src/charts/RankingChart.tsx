import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatIndex, scoreTone } from "../utils/format";
import { axisProps, tooltipProps } from "./chartTheme";

export interface RankingItem {
    name: string;
    score: number;
}

const TONE_COLORS = { high: "var(--color-positive)", mid: "var(--color-chart-1)", low: "var(--color-negative)", none: "var(--color-chart-1)" };

// Barras horizontales con las provincias de mayor Property Score; el color indica el tramo de puntuación.
export function RankingChart({ items }: { items: RankingItem[] }) {
    return (
        <div className="chart" role="img" aria-label="Provincias con mayor Property Score">
            <ResponsiveContainer width="100%" height={Math.max(220, items.length * 38)}>
                <BarChart data={items} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="name" {...axisProps} width={110} />
                    <Tooltip {...tooltipProps} formatter={(value) => formatIndex(Number(value))} />
                    <Bar dataKey="score" name="Score" radius={[0, 10, 10, 0]} barSize={18} animationDuration={600}>
                        {items.map((item) => (
                            <Cell key={item.name} fill={TONE_COLORS[scoreTone(item.score)]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}