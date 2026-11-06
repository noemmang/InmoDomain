import { Children, useLayoutEffect, useRef, type ReactNode } from "react";

// Alto de cada fila de la rejilla (debe coincidir con grid-auto-rows de .masonry en dashboard.css)
// y hueco vertical que se deja debajo de cada tarjeta.
const ROW_HEIGHT = 8;
const ROW_GAP = 16;

// Rejilla tipo mosaico: cada tarjeta ocupa tantas filas como mida y las siguientes rellenan los huecos libres,
// así una tarjeta alta no deja un vacío junto a otra más baja. El número de columnas se adapta al ancho.
export function Masonry({ children }: { children: ReactNode }) {
    const rootRef = useRef<HTMLDivElement>(null);
    const items = Children.toArray(children);

    // Se mide el contenido de cada tarjeta (también cuando cambia de tamaño al cargar datos o al girar la pantalla).
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const item = entry.target.parentElement;
                if (!item) continue;
                const height = entry.target.getBoundingClientRect().height;
                item.style.gridRowEnd = `span ${Math.max(1, Math.ceil((height + ROW_GAP) / ROW_HEIGHT))}`;
            }
        });

        root.querySelectorAll(":scope > .masonry__item > .masonry__inner").forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, [items.length]);

    return (
        <div className="masonry" ref={rootRef}>
            {items.map((child, index) => (
                <div className="masonry__item" key={index}>
                    <div className="masonry__inner">{child}</div>
                </div>
            ))}
        </div>
    );
}