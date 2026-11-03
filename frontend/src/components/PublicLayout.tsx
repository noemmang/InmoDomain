import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ButtonLink } from "./Button";
import { Logo } from "./Logo";

// Estructura de la portada: cabecera con navegación por secciones, contenido y pie de página.
export function PublicLayout() {
    const { status } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    return (
        <div className="public-layout">
            <header className="public-header">
                <div className="public-header__inner">
                    <Logo />
                    <nav className={`public-header__nav${menuOpen ? " public-header__nav--open" : ""}`} aria-label="Principal">
                        <a href="#funciones" onClick={closeMenu}>Funciones</a>
                        <a href="#como-funciona" onClick={closeMenu}>Cómo funciona</a>
                        <a href="#score" onClick={closeMenu}>Property Score</a>
                        <Link to="/explorar" onClick={closeMenu}>Explorar</Link>
                    </nav>
                    <div className="public-header__actions">
                        {status === "authenticated" ? (
                            <ButtonLink to="/explorar" small>Ir al panel</ButtonLink>
                        ) : (
                            <>
                                <ButtonLink to="/login" variant="ghost" small>Entrar</ButtonLink>
                                <ButtonLink to="/registro" small>Crear cuenta</ButtonLink>
                            </>
                        )}
                        <button
                            type="button"
                            className="icon-button public-header__toggle"
                            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((open) => !open)}
                        >
                            {menuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </header>

            <main>
                <Outlet />
            </main>

            <footer className="public-footer">
                <div className="public-footer__inner">
                    <Logo />
                    <p className="public-footer__text">
                        Proyecto educativo de análisis del mercado inmobiliario español. Datos oficiales del INE y del MIVAU.
                    </p>
                    <nav className="public-footer__links" aria-label="Pie de página">
                        <Link to="/explorar">Explorar</Link>
                        <Link to="/comparar">Comparar</Link>
                        <a href="https://github.com/noemmang/InmoDomain" target="_blank" rel="noreferrer">GitHub</a>
                    </nav>
                </div>
            </footer>
        </div>
    );
}