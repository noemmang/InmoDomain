import { useMemo, useRef, useState } from "react";
import { METRICS, formatMetric, type MarketRow } from "../utils/market";
import { MapTooltip } from "./MapTooltip";
import { SpainMap, type MapTone } from "./SpainMap";

interface MarketMapProps {
    rows: MarketRow[];
    tones: Record<string, MapTone>;
    labels: Record<string, string>;
    selected: string | null;
    // Provincia resaltada desde fuera, por ejemplo la fila de la tabla bajo el ratón.
    highlighted: string | null;
    label: string;
    // Texto que se muestra sobre el mapa cuando la lectura no tiene datos; null si hay datos.
    emptyMessage: string | null;
    onSelect: (code: string) => void;
}

interface HoverState {
    code: string;
    // Posición del puntero dentro del mapa; null si el foco llegó por teclado y no hay recuadro.
    point: { x: number; y: number } | null;
    flip: boolean;
}

// Mapa del panel con recuadro flotante. El estado del puntero vive aquí para que moverlo no vuelva a pintar el resto de la página.
export function MarketMap({ rows, tones, labels, selected, highlighted, label, emptyMessage, onSelect }: MarketMapProps) {
    const [hover, setHover] = useState<HoverState | null>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const rowByCode = useMemo(() => new Map(rows.map((row) => [row.code, row])), [rows]);
    const hoverRow = hover ? rowByCode.get(hover.code) : undefined;

    function handleHover(code: string | null, point?: { x: number; y: number }) {
        const stage = stageRef.current;
        if (!code || !stage) {
            setHover(null);
            return;
        }
        if (!point) {
            setHover({ code, point: null, flip: false });
            return;
        }
        const box = stage.getBoundingClientRect();
        const x = point.x - box.left;
        setHover({ code, point: { x, y: point.y - box.top }, flip: x > box.width * 0.55 });
    }

    return (
        <div className="map-stage" ref={stageRef}>
            <SpainMap
                tones={tones}
                labels={labels}
                selected={selected}
                highlighted={hover?.code ?? highlighted}
                onSelect={onSelect}
                onHover={handleHover}
                label={label}
            />
            {hover?.point && hoverRow && (
                <MapTooltip
                    name={hoverRow.name}
                    community={hoverRow.community}
                    x={hover.point.x}
                    y={hover.point.y}
                    flip={hover.flip}
                    lines={METRICS.map((metric) => ({ label: metric.label, value: formatMetric(metric, metric.pick(hoverRow)) }))}
                />
            )}
            {emptyMessage && <p className="map-stage__empty">{emptyMessage}</p>}
        </div>
    );
}
