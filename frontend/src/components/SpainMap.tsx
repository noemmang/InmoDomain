import { CANARIAS_BOX, PROVINCE_SHAPES, SPAIN_VIEWBOX } from "../data/spainMapData";

export type MapTone = "none" | "h1" | "h2" | "h3" | "h4" | "h5" | "up" | "down" | "dim";

interface SpainMapProps {
    // Tono de cada provincia por código INE ("28", "08"…). Sin dato, la provincia queda neutra.
    tones?: Record<string, MapTone>;
    // Provincias con un punto que late encima (las destacadas).
    pulses?: string[];
    label: string;
}

// Mapa de España decorativo y no interactivo: las provincias entran en cascada, cambian de color con
// transición suave y las destacadas laten. La interactividad queda para los paneles.
export function SpainMap({ tones = {}, pulses = [], label }: SpainMapProps) {
    const pulseShapes = PROVINCE_SHAPES.filter((shape) => pulses.includes(shape.code));

    return (
        <svg
            className="spain-map"
            viewBox={`0 0 ${SPAIN_VIEWBOX.width} ${SPAIN_VIEWBOX.height}`}
            role="img"
            aria-label={label}
        >
            <rect
                className="spain-map__box"
                x={CANARIAS_BOX.x}
                y={CANARIAS_BOX.y}
                width={CANARIAS_BOX.width}
                height={CANARIAS_BOX.height}
                rx="14"
            />
            <g>
                {PROVINCE_SHAPES.map((shape, index) => (
                    <path
                        key={shape.code}
                        d={shape.d}
                        className={`spain-map__province spain-map__province--${tones[shape.code] ?? "none"}`}
                        style={{ animationDelay: `${(index * 37) % 900}ms` }}
                    />
                ))}
            </g>
            <g className="spain-map__pulses">
                {pulseShapes.map((shape, index) => (
                    <g key={shape.code} transform={`translate(${shape.c[0]} ${shape.c[1]})`}>
                        <circle className="spain-map__ring" r="6" style={{ animationDelay: `${index * 420}ms` }} />
                        <circle className="spain-map__dot" r="5" />
                    </g>
                ))}
            </g>
        </svg>
    );
}
