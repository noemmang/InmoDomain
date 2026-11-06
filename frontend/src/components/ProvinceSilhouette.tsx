import { PROVINCE_SHAPES } from "../data/spainMapData";

const PADDING = 6;

// Caja que envuelve el contorno de cada provincia, calculada una vez a partir de las coordenadas de su trazado.
const boxes = new Map<string, string>();

function boxOf(code: string, path: string): string {
    const cached = boxes.get(code);
    if (cached) return cached;

    const numbers = (path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const xs = numbers.filter((_value, index) => index % 2 === 0);
    const ys = numbers.filter((_value, index) => index % 2 === 1);
    const minX = Math.min(...xs) - PADDING;
    const minY = Math.min(...ys) - PADDING;
    const box = `${minX} ${minY} ${Math.max(...xs) + PADDING - minX} ${Math.max(...ys) + PADDING - minY}`;

    boxes.set(code, box);
    return box;
}

// Silueta de una provincia sola, encuadrada a su tamaño; no renderiza nada si el código no existe.
export function ProvinceSilhouette({ code, name }: { code: string; name: string }) {
    const shape = PROVINCE_SHAPES.find((item) => item.code === code);
    if (!shape) return null;

    return (
        <svg className="province-silhouette" viewBox={boxOf(code, shape.d)} role="img" aria-label={`Silueta de ${name}`}>
            <path d={shape.d} />
        </svg>
    );
}
