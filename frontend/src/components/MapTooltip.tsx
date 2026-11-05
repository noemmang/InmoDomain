interface MapTooltipProps {
    name: string;
    community: string;
    // Posición dentro de la tarjeta del mapa, en píxeles.
    x: number;
    y: number;
    // Si el puntero está en la mitad derecha, el recuadro se abre hacia la izquierda para no salirse.
    flip: boolean;
    lines: { label: string; value: string }[];
}

// Recuadro flotante con las cifras de la provincia bajo el puntero.
export function MapTooltip({ name, community, x, y, flip, lines }: MapTooltipProps) {
    return (
        <div className={`map-tooltip${flip ? " map-tooltip--flip" : ""}`} style={{ left: x, top: y }} role="presentation">
            <strong className="map-tooltip__name">{name}</strong>
            <span className="map-tooltip__community">{community}</span>
            <dl className="map-tooltip__lines">
                {lines.map((line) => (
                    <div key={line.label}>
                        <dt>{line.label}</dt>
                        <dd>{line.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
