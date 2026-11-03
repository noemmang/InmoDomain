import { Link } from "react-router-dom";

// Marca de la aplicación: icono de casa y nombre, con enlace a la portada.
export function Logo({ to = "/" }: { to?: string }) {
    return (
        <Link to={to} className="logo" aria-label="InmoDomain, ir al inicio">
            <svg className="logo__icon" viewBox="0 0 64 64" aria-hidden="true">
                <rect width="64" height="64" rx="18" fill="currentColor" />
                <path d="M14 32 32 16l18 16v16a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2Z" fill="var(--color-text)" />
                <rect x="26" y="34" width="12" height="16" rx="3" fill="currentColor" />
            </svg>
            <span className="logo__name">InmoDomain</span>
        </Link>
    );
}