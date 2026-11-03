import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLElement> {
    title?: string;
    action?: ReactNode;
    flush?: boolean;
}

// Contenedor redondeado de superficie con cabecera opcional (título y acción a la derecha).
export function Card({ title, action, flush, className, children, ...rest }: CardProps) {
    return (
        <section {...rest} className={["card", flush && "card--flush", className].filter(Boolean).join(" ")}>
            {(title || action) && (
                <header className="card__header">
                    {title && <h2 className="card__title">{title}</h2>}
                    {action}
                </header>
            )}
            {children}
        </section>
    );
}