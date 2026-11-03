import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuración de Vite: plugin de React y puerto 3000 (el origen que permite el CORS del Gateway en desarrollo).
export default defineConfig({
    plugins: [react()],
    server: { port: 3000, strictPort: true },
});