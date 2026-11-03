import { LogOut } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/endpoints";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field, FormMessage } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { initials } from "../utils/format";

// Perfil del usuario: datos personales, cambio de contraseña y cierre de sesión.
export function ProfilePage() {
    const { user, setUser, logout } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState(user?.name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [profileMessage, setProfileMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
    const [savingPassword, setSavingPassword] = useState(false);

    async function saveProfile(event: FormEvent) {
        event.preventDefault();
        setProfileMessage(null);
        setSavingProfile(true);
        try {
            setUser(await authApi.updateMe(name.trim(), email.trim()));
            setProfileMessage({ kind: "success", text: "Datos actualizados." });
        } catch (reason) {
            setProfileMessage({ kind: "error", text: reason instanceof Error ? reason.message : "No se han podido guardar los datos." });
        } finally {
            setSavingProfile(false);
        }
    }

    async function savePassword(event: FormEvent) {
        event.preventDefault();
        setPasswordMessage(null);
        setSavingPassword(true);
        try {
            await authApi.changePassword(currentPassword, newPassword);
            setPasswordMessage({ kind: "success", text: "Contraseña cambiada. Se han cerrado tus otras sesiones; vuelve a entrar." });
            setCurrentPassword("");
            setNewPassword("");
            // El backend revoca todas las sesiones al cambiar la contraseña, así que se cierra también la actual.
            window.setTimeout(async () => {
                await logout();
                navigate("/login", { replace: true });
            }, 1800);
        } catch {
            setPasswordMessage({ kind: "error", text: "La contraseña actual no es correcta o la nueva no cumple los requisitos." });
        } finally {
            setSavingPassword(false);
        }
    }

    async function handleLogout() {
        await logout();
        navigate("/", { replace: true });
    }

    return (
        <div className="page">
            <header className="page__header">
                <div className="profile-header">
                    <span className="avatar avatar--large">{initials(user?.name ?? "")}</span>
                    <div>
                        <h1 className="page__title">{user?.name}</h1>
                        <p className="page__subtitle">{user?.email}</p>
                    </div>
                </div>
                <Button variant="secondary" small onClick={handleLogout}><LogOut size={16} /> Cerrar sesión</Button>
            </header>

            <div className="grid-two grid-two--even">
                <Card title="Datos personales">
                    <form className="form" onSubmit={saveProfile}>
                        <Field label="Nombre" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
                        <Field label="Correo electrónico" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                        {profileMessage && <FormMessage kind={profileMessage.kind}>{profileMessage.text}</FormMessage>}
                        <Button type="submit" loading={savingProfile}>Guardar cambios</Button>
                    </form>
                </Card>

                <Card title="Cambiar contraseña">
                    <form className="form" onSubmit={savePassword}>
                        <Field label="Contraseña actual" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                        <Field label="Contraseña nueva" type="password" autoComplete="new-password" required minLength={8} maxLength={128} hint="Mínimo 8 caracteres." value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                        {passwordMessage && <FormMessage kind={passwordMessage.kind}>{passwordMessage.text}</FormMessage>}
                        <Button type="submit" loading={savingPassword}>Cambiar contraseña</Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}