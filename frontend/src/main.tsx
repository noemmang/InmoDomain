import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/plus-jakarta-sans";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { warmUpBackend } from "./api/warmup";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import "./styles.css";
import "./dashboard.css";
import "./responsive.css";

// Punto de entrada: despierta el backend y envuelve la app con el router y los contextos de sesión, favoritos y avisos.
warmUpBackend();
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <FavoritesProvider>
                    <NotificationsProvider>
                        <App />
                    </NotificationsProvider>
                </FavoritesProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>,
);