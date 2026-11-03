import type { PropertySale } from "../api/types";
import { formatNumber } from "../utils/format";

const MONTH_LABELS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

// Mapa de calor de operaciones por año (filas) y mes (columnas): cuanto más intenso, más compraventas.
export function ActivityHeatmap({ sales }: { sales: PropertySale[] }) {
    const totals = new Map<string, number>();
    sales.forEach((sale) => {
        const [year, month] = sale.period.split("-");
        const key = `${year}-${Number(month)}`;
        totals.set(key, (totals.get(key) ?? 0) + sale.operationsCount);
    });

    const years = [...new Set(sales.map((sale) => sale.period.slice(0, 4)))].sort().slice(-6);
    const max = Math.max(1, ...totals.values());

    return (
        <div className="heatmap" role="img" aria-label="Mapa de calor de compraventas por año y mes">
            <div className="heatmap__row heatmap__row--head">
                <span />
                {MONTH_LABELS.map((label, index) => (
                    <span key={index} className="heatmap__month">{label}</span>
                ))}
            </div>
            {years.map((year) => (
                <div key={year} className="heatmap__row">
                    <span className="heatmap__year">{year}</span>
                    {MONTH_LABELS.map((_, index) => {
                        const value = totals.get(`${year}-${index + 1}`);
                        const level = value == null ? 0 : Math.max(1, Math.ceil((value / max) * 5));
                        return (
                            <span
                                key={index}
                                className={`heatmap__cell heatmap__cell--level-${level}`}
                                title={value == null ? "Sin datos" : `${formatNumber(value)} operaciones`}
                            />
                        );
                    })}
                </div>
            ))}
            <div className="heatmap__scale">
                <span>Menos</span>
                {[1, 2, 3, 4, 5].map((level) => (
                    <span key={level} className={`heatmap__cell heatmap__cell--level-${level}`} />
                ))}
                <span>Más</span>
            </div>
        </div>
    );
}