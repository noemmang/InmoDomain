interface RankListItem {
    code: string;
    name: string;
    value: string;
}

interface RankListProps {
    title: string;
    items: RankListItem[];
    selected: string | null;
    onSelect: (code: string) => void;
}

// Lista numerada de provincias con su valor; cada fila selecciona la provincia en el mapa.
export function RankList({ title, items, selected, onSelect }: RankListProps) {
    return (
        <div className="rank-list">
            <h3 className="rank-list__title">{title}</h3>
            <ol className="rank-list__items">
                {items.map((item, index) => (
                    <li key={item.code}>
                        <button
                            type="button"
                            className={`rank-list__item${item.code === selected ? " rank-list__item--active" : ""}`}
                            onClick={() => onSelect(item.code)}
                        >
                            <span className="rank-list__position">{index + 1}</span>
                            <span className="rank-list__name">{item.name}</span>
                            <strong className="rank-list__value">{item.value}</strong>
                        </button>
                    </li>
                ))}
            </ol>
        </div>
    );
}
