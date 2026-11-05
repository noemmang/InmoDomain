import { API_URL } from "../config";

let requested = false;

// Avisa al Gateway nada más abrir la web para que despierte a la vez todos los servicios; la respuesta ni se espera ni se usa.
export function warmUpBackend() {
    if (requested) return;
    requested = true;
    fetch(`${API_URL}/warmup`).catch(() => undefined);
}
