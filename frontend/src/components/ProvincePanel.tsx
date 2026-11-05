import { SCORE_NAME } from "../utils/brand";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatNumber, formatPercent, formatPrice, formatIndex, formatQuarter, scoreTone } from "../utils/format";
import { formatMetric, metricOf, type MapMetric, type MarketRow } from "../utils/market";
import { ButtonLink } from "./Button";
import { Card } from "./Card";
import { FavoriteButton } from "./FavoriteButton";

interface ProvincePanelProps {
    row: MarketRow;
    period: string;
    metric: MapMetric;
    // Posición en la métrica del mapa (1 = valor más alto) y número de provincias con dato.
    rank: number | null;
    ranked: number;
    medianPrice: number | null;
    onClose: () => void;
}

// Resumen de la provincia seleccionada en el mapa: cifras del trimestre, posición y accesos a ficha y comparador.
export function ProvincePanel({ row, period, metric, rank, ranked, medianPrice, onClose }: ProvincePanelProps) {
    const definition = metricOf(metric);
    const priceGap = row.price != null && medianPrice ? (row.price / medianPrice - 1) * 100 : null;

    return (
        <Card className="province-panel">
            <header className="province-panel__header">
                <div>
                    <h2 className="province-panel__name">{row.name}</h2>
                    <p className="province-panel__community">{row.community} · {formatNumber(row.population)} habitantes</p>
                </div>
                <button type="button" className="province-panel__close" onClick={onClose} aria-label="Cerrar el resumen de la provincia">
                    <X size={18} aria-hidden="true" />
                </button>
            </header>

            {rank != null && (
                <p className="province-panel__rank">
                    Nº <strong>{rank}</strong> de {ranked} en {definition.label.toLowerCase()} ({formatMetric(definition, definition.pick(row))})
                </p>
            )}

            <dl className="province-panel__stats">
                <div>
                    <dt>{SCORE_NAME}</dt>
                    <dd><span className={`score-pill score-pill--${scoreTone(row.score)}`}>{formatIndex(row.score)}</span></dd>
                </div>
                <div>
                    <dt>Precio</dt>
                    <dd>{formatPrice(row.price)}</dd>
                </div>
                <div>
                    <dt>Variación anual</dt>
                    <dd className={(row.priceChange ?? 0) < 0 ? "text-negative" : "text-positive"}>{formatPercent(row.priceChange, true)}</dd>
                </div>
                <div>
                    <dt>Compraventas</dt>
                    <dd>{row.operations == null ? "—" : formatNumber(row.operations)}</dd>
                </div>
                <div>
                    <dt>Por 1.000 hab.</dt>
                    <dd>{formatMetric(metricOf("operationsRate"), row.operationsRate, false)}</dd>
                </div>
                <div>
                    <dt>Vivienda nueva</dt>
                    <dd>{formatPercent(row.newShare)}</dd>
                </div>
            </dl>

            {priceGap != null && (
                <p className="province-panel__note">
                    Su precio está un <strong>{formatPercent(Math.abs(priceGap))}</strong> {priceGap >= 0 ? "por encima" : "por debajo"} de
                    la mediana provincial en el {formatQuarter(period)}.
                </p>
            )}

            <div className="province-panel__actions">
                <FavoriteButton provinceCode={row.code} withLabel />
                <ButtonLink to={`/provincia/${row.code}`} small>Ver ficha</ButtonLink>
                <ButtonLink to={`/comparar?p=${row.code}`} variant="secondary" small>Comparar</ButtonLink>
            </div>
            <Link className="province-panel__link" to={`/alertas?provincia=${row.code}`}>Crear una alerta para esta provincia</Link>
        </Card>
    );
}
