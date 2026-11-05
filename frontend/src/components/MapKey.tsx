import type { MapTone } from "./SpainMap";

interface MapKeyProps {
    title: string;
    items: { tone: MapTone; label: string }[];
}

// Leyenda del mapa: un color por tramo con el rango de valores que cubre, más el color de "sin dato".
export function MapKey({ title, items }: MapKeyProps) {
    return (
        <div className="map-key">
            <span className="map-key__title">{title}</span>
            <ul className="map-key__list">
                {items.map((item) => (
                    <li key={item.tone} className="map-key__item">
                        <span className={`map-key__swatch map-key__swatch--${item.tone}`} aria-hidden="true" />
                        {item.label}
                    </li>
                ))}
                <li className="map-key__item">
                    <span className="map-key__swatch map-key__swatch--none" aria-hidden="true" />
                    Sin dato
                </li>
            </ul>
        </div>
    );
}
