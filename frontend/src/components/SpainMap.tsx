import type { KeyboardEvent, PointerEvent } from "react";
import { CANARIAS_BOX, PROVINCE_SHAPES, SPAIN_VIEWBOX } from "../data/spainMapData";

export type MapTone = "none" | "h1" | "h2" | "h3" | "h4" | "h5" | "up" | "down" | "dim";

interface SpainMapProps {
    // Tono de cada provincia por código INE ("28", "08"…). Sin dato, la provincia queda neutra.
    tones?: Record<string, MapTone>;
    // Provincias con un punto que late encima (las destacadas).
    pulses?: string[];
    label: string;
    // Modo interactivo: se activa al pasar onSelect. Cada provincia pasa a ser un botón con su texto accesible.
    selected?: string | null;
    // Provincia resaltada desde fuera (por ejemplo, la fila de la tabla bajo el ratón).
    highlighted?: string | null;
    labels?: Record<string, string>;
    onSelect?: (code: string) => void;
    // Informa de la provincia bajo el ratón y de la posición del puntero en pantalla; null al salir.
    onHover?: (code: string | null, point?: { x: number; y: number }) => void;
}

// Mapa de España: las provincias entran en cascada, cambian de color con transición suave y las destacadas laten.
// Sin onSelect es decorativo (portada); con onSelect cada provincia responde a ratón, teclado y toque.
export function SpainMap({ tones = {}, pulses = [], label, selected = null, highlighted = null, labels = {}, onSelect, onHover }: SpainMapProps) {
    const interactive = Boolean(onSelect);
    const pulseShapes = PROVINCE_SHAPES.filter((shape) => pulses.includes(shape.code));
    const outlined = PROVINCE_SHAPES.filter((shape) => shape.code === selected || shape.code === highlighted);

    // El tooltip solo sale con ratón: en pantallas táctiles el toque selecciona y el detalle va en el panel.
    function handlePointer(code: string, event: PointerEvent<SVGPathElement>) {
        if (event.pointerType === "mouse") onHover?.(code, { x: event.clientX, y: event.clientY });
    }

    function handleKey(code: string, event: KeyboardEvent<SVGPathElement>) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onSelect?.(code);
    }

    return (
        <svg
            className={`spain-map${interactive ? " spain-map--interactive" : ""}`}
            viewBox={`0 0 ${SPAIN_VIEWBOX.width} ${SPAIN_VIEWBOX.height}`}
            role={interactive ? "group" : "img"}
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
                        {...(interactive
                            ? {
                                role: "button",
                                tabIndex: 0,
                                "aria-label": labels[shape.code] ?? shape.name,
                                "aria-pressed": selected === shape.code,
                                onClick: () => onSelect?.(shape.code),
                                onKeyDown: (event: KeyboardEvent<SVGPathElement>) => handleKey(shape.code, event),
                                onPointerEnter: (event: PointerEvent<SVGPathElement>) => handlePointer(shape.code, event),
                                onPointerMove: (event: PointerEvent<SVGPathElement>) => handlePointer(shape.code, event),
                                onPointerLeave: () => onHover?.(null),
                                onFocus: () => onHover?.(shape.code),
                                onBlur: () => onHover?.(null),
                            }
                            : {})}
                    />
                ))}
            </g>
            <g className="spain-map__outlines">
                {outlined.map((shape) => (
                    <path
                        key={shape.code}
                        d={shape.d}
                        className={`spain-map__outline${shape.code === selected ? " spain-map__outline--selected" : ""}`}
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
