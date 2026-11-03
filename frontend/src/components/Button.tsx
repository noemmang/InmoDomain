import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface StyleProps {
    variant?: Variant;
    small?: boolean;
    block?: boolean;
    className?: string;
}

// Construye las clases BEM del botón a partir de sus opciones.
function buttonClass({ variant = "primary", small, block, className }: StyleProps): string {
    return ["button", `button--${variant}`, small && "button--small", block && "button--block", className]
        .filter(Boolean)
        .join(" ");
}

// Botón de un solo color; el estado de carga bloquea el clic y muestra un spinner.
export function Button({
    variant, small, block, className, loading, children, disabled, ...rest
}: StyleProps & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; children: ReactNode }) {
    return (
        <button {...rest} className={buttonClass({ variant, small, block, className })} disabled={disabled || loading}>
            {loading && <span className="spinner spinner--inline" aria-hidden="true" />}
            {children}
        </button>
    );
}

// Enlace con aspecto de botón para navegar entre páginas.
export function ButtonLink({
    variant, small, block, className, children, ...rest
}: StyleProps & LinkProps & { children: ReactNode }) {
    return (
        <Link {...rest} className={buttonClass({ variant, small, block, className })}>
            {children}
        </Link>
    );
}