import { Navigate, Route, Routes } from "react-router-dom";
import { AccountLayout } from "./components/AccountLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/MainLayout";
import { AlertsPage } from "./pages/AlertsPage";
import { ComparePage } from "./pages/ComparePage";
import { ExplorePage } from "./pages/ExplorePage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProvincePage } from "./pages/ProvincePage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

// Mapa de rutas: páginas públicas (inicio, explorar, comparar), pantallas de acceso y zona de cuenta con sesión.
export function App() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/explorar" element={<ExplorePage />} />
                <Route path="/provincia/:code" element={<ProvincePage />} />
                <Route path="/comparar" element={<ComparePage />} />
                <Route path="/panel" element={<Navigate to="/explorar" replace />} />
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
            <Route path="/recuperar" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<AccountLayout />}>
                    <Route path="/perfil" element={<ProfilePage />} />
                    <Route path="/favoritos" element={<FavoritesPage />} />
                    <Route path="/alertas" element={<AlertsPage />} />
                    <Route path="/notificaciones" element={<NotificationsPage />} />
                </Route>
            </Route>

            <Route element={<MainLayout />}>
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}
