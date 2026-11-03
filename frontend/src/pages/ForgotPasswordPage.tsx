import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/endpoints";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { Field, FormMessage } from "../components/Field";

// Solicitud del enlace para restablecer la contraseña. La API responde igual exista o no el correo.
export function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await authApi.forgotPassword(email.trim());
            setSent(true);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "No se ha podido enviar la solicitud.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Recupera tu contraseña"
            subtitle="Te enviaremos un enlace para elegir una nueva."
            footer={<Link to="/login">Volver a iniciar sesión</Link>}
        >
            {sent ? (
                <FormMessage kind="success">
                    Si el correo está registrado, recibirás un enlace en unos minutos. Caduca en una hora.
                </FormMessage>
            ) : (
                <form className="form" onSubmit={handleSubmit}>
                    <Field label="Correo electrónico" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                    {error && <FormMessage kind="error">{error}</FormMessage>}
                    <Button type="submit" block loading={loading}>Enviar enlace</Button>
                </form>
            )}
        </AuthLayout>
    );
}