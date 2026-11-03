import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";

interface AuthLayoutProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer?: ReactNode;
    // Las pantallas de login y registro redirigen al panel si ya hay sesión; la de restablecer no.
    redirectIfAuthenticated?: boolean;
}

// Tarjeta centrada para login, registro y recuperación de contraseña, con un panel lateral decorativo.
export function AuthLayout({ title, subtitle, children, footer, redirectIfAuthenticated = true }: AuthLayoutProps) {
    const { status } = useAuth();

    if (redirectIfAuthenticated && status === "authenticated") return <Navigate to="/perfil" replace />;

    return (
        <div className="auth-layout">
            <div className="auth-layout__panel">
                <Logo />
                <h2 className="auth-layout__claim">El mercado inmobiliario, provincia a provincia.</h2>
                <p className="auth-layout__text">
                    Índices propios, tendencias y alertas construidos con datos oficiales del INE y del MIVAU.
                </p>
            </div>
            <div className="auth-layout__form">
                <div className="auth-card">
                    <h1 className="auth-card__title">{title}</h1>
                    <p className="auth-card__subtitle">{subtitle}</p>
                    {children}
                    {footer && <div className="auth-card__footer">{footer}</div>}
                </div>
            </div>
        </div>
    );
}