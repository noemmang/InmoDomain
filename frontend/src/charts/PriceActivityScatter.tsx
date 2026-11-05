import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, type TooltipContentProps } from "recharts";
import { formatDecimal, formatNumber, formatPrice } from "../utils/format";
import { axisProps, gridProps } from "./chartTheme";

export interface ScatterPoint {
    code: string;
    name: string;
    price: number;
    rate: number;
    population: number;
}

interface PriceActivityScatterProps {
    points: ScatterPoint[];
    selected: string | null;
    onSelect: (code: string) => void;
}

interface DotProps {
    cx: number;
    cy: number;
    size: number;
    payload: ScatterPoint;
}

// Recuadro del gráfico con los datos de la provincia bajo el puntero.
function ScatterTooltip({ active, payload }: TooltipContentProps) {
    const point = active ? (payload?.[0]?.payload as ScatterPoint | undefined) : undefined;
    if (!point) return null;

    return (
        <div className="chart-tooltip">
            <strong>{point.name}</strong>
            <span>{formatPrice(point.price)}</span>
            <span>{formatDecimal(point.rate)} compraventas por 1.000 hab.</span>
            <span>{formatNumber(point.population)} habitantes</span>
        </div>
    );
}

// Dispersión de provincias: precio por m² (horizontal) frente a compraventas por 1.000 habitantes (vertical); el tamaño es la población.
export function PriceActivityScatter({ points, selected, onSelect }: PriceActivityScatterProps) {
    // Punto redondo cuyo radio sale del área que calcula el eje Z; el seleccionado se pinta en ámbar.
    function renderDot(props: unknown) {
        const { cx, cy, size, payload } = props as DotProps;
        const active = payload.code === selected;

        return (
            <circle
                className={`scatter-dot${active ? " scatter-dot--active" : ""}`}
                cx={cx}
                cy={cy}
                r={Math.sqrt(size / Math.PI)}
                onClick={() => onSelect(payload.code)}
            />
        );
    }

    return (
        <div className="chart" role="img" aria-label="Precio por metro cuadrado frente a compraventas por cada mil habitantes en cada provincia">
            <ResponsiveContainer width="100%" height={420}>
                <ScatterChart margin={{ top: 8, right: 16, bottom: 20, left: 0 }}>
                    <CartesianGrid {...gridProps} vertical />
                    <XAxis
                        type="number"
                        dataKey="price"
                        name="Precio"
                        {...axisProps}
                        domain={["dataMin - 100", "dataMax + 100"]}
                        tickFormatter={(value) => `${Math.round(value)}`}
                        label={{ value: "Precio (€/m²)", position: "insideBottom", offset: -12, fill: "var(--color-text-muted)", fontSize: 12 }}
                    />
                    <YAxis
                        type="number"
                        dataKey="rate"
                        name="Compraventas"
                        {...axisProps}
                        width={44}
                        label={{ value: "Compraventas por 1.000 hab.", angle: -90, position: "insideLeft", offset: 12, fill: "var(--color-text-muted)", fontSize: 12 }}
                    />
                    <ZAxis type="number" dataKey="population" range={[50, 700]} />
                    <Tooltip cursor={false} content={ScatterTooltip} />
                    <Scatter data={points} shape={renderDot} isAnimationActive={false} />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
