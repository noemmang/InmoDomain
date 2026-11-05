interface BarListItem {
    key: string;
    label: string;
    value: number;
    display: string;
    note?: string;
}

interface BarListProps {
    items: BarListItem[];
    activeKey?: string | null;
    onSelect?: (key: string) => void;
}

// Barras horizontales ligeras con etiqueta y valor; con onSelect cada fila es un botón.
export function BarList({ items, activeKey = null, onSelect }: BarListProps) {
    const maximum = Math.max(...items.map((item) => item.value));
    const floor = Math.min(0, ...items.map((item) => item.value));
    const span = maximum - floor || 1;

    return (
        <ul className="bar-list">
            {items.map((item) => {
                const width = Math.max(2, ((item.value - floor) / span) * 100);
                const content = (
                    <>
                        <span className="bar-list__label">
                            {item.label}
                            {item.note && <small>{item.note}</small>}
                        </span>
                        <span className="bar-list__track">
                            <span className="bar-list__bar" style={{ width: `${width}%` }} />
                        </span>
                        <strong className="bar-list__value">{item.display}</strong>
                    </>
                );

                return (
                    <li key={item.key}>
                        {onSelect ? (
                            <button
                                type="button"
                                className={`bar-list__row${item.key === activeKey ? " bar-list__row--active" : ""}`}
                                onClick={() => onSelect(item.key)}
                            >
                                {content}
                            </button>
                        ) : (
                            <div className="bar-list__row">{content}</div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
