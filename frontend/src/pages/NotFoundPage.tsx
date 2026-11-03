import { ButtonLink } from "../components/Button";
import { EmptyState } from "../components/StateViews";

// Página para rutas que no existen.
export function NotFoundPage() {
    return (
        <div className="page page--centered">
            <EmptyState
                title="Esta página no existe"
                text="Puede que el enlace esté mal escrito o que la página se haya movido."
                action={<ButtonLink to="/">Volver al inicio</ButtonLink>}
            />
        </div>
    );
}