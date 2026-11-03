import type { ReactNode } from "react";
import { Button } from "./Button";

// Estado de carga. Si tarda, avisa de que el servidor puede estar arrancando (escala a cero en Azure).
export function LoadingState({ slow, label = "Cargando datos" }: { slow?: boolean; label?: string }) {
    return (
        <div className="state" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p className="state__title">{label}…</p>
            {slow && (
                <p className="state__text">
                    El servidor se está despertando tras un rato de inactividad. Suele tardar unos 25 segundos la primera vez.
                </p>
            )}
        </div>
    );
}

// Estado de error con botón opcional para reintentar.
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="state state--error" role="alert">
            <p className="state__title">No se han podido cargar los datos</p>
            <p className="state__text">{message}</p>
            {onRetry && (
                <Button variant="secondary" small onClick={onRetry}>
                    Reintentar
                </Button>
            )}
        </div>
    );
}

// Estado vacío: explica qué falta y ofrece una acción.
export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
    return (
        <div className="state">
            <p className="state__title">{title}</p>
            <p className="state__text">{text}</p>
            {action}
        </div>
    );
}