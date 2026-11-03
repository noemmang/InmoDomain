interface Option<T extends string | number> {
    value: T;
    label: string;
}

interface SegmentedControlProps<T extends string | number> {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    label: string;
}

// Selector de varias opciones excluyentes en forma de píldora (periodo, tipo de índice...).
export function SegmentedControl<T extends string | number>({ options, value, onChange, label }: SegmentedControlProps<T>) {
    return (
        <div className="segmented" role="group" aria-label={label}>
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className={`segmented__option${option.value === value ? " segmented__option--active" : ""}`}
                    aria-pressed={option.value === value}
                    onClick={() => onChange(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}