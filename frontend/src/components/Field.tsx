import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    hint?: ReactNode;
}

// Campo de formulario con etiqueta y texto de ayuda opcional.
export function Field({ label, hint, id, ...input }: FieldProps) {
    const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
        <label className="field" htmlFor={fieldId}>
            <span className="field__label">{label}</span>
            <input className="field__input" id={fieldId} {...input} />
            {hint && <span className="field__hint">{hint}</span>}
        </label>
    );
}

// Mensaje de formulario: error (rojo suave) o confirmación (verde suave).
export function FormMessage({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
    return (
        <p className={`form-message form-message--${kind}`} role={kind === "error" ? "alert" : "status"}>
            {children}
        </p>
    );
}

interface SelectFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}

// Campo desplegable con etiqueta, para elegir entre opciones cerradas (provincia, métrica, condición).
export function SelectField({ label, value, onChange, options, placeholder }: SelectFieldProps) {
    return (
        <label className="field">
            <span className="field__label">{label}</span>
            <select className="field__input field__input--select" value={value} onChange={(event) => onChange(event.target.value)}>
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </label>
    );
}