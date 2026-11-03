import { TrendingUp } from "lucide-react";

// Ventanas de los edificios: cada una indica si está encendida (ámbar) y su retardo de parpadeo.
function buildWindows(x: number, y: number, columns: number, rows: number, litPattern: number[]) {
    const windows = [];
    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const index = row * columns + column;
            windows.push({ x: x + column * 24, y: y + row * 28, lit: litPattern.includes(index), delay: (index % 5) * 0.6 });
        }
    }
    return windows;
}

// Escena decorativa de la portada: ciudad en vectores con ventanas que parpadean y tarjetas flotantes.
// Las tarjetas son solo ilustración: no muestran cifras reales.
export function HeroIllustration() {
    const towerA = buildWindows(76, 170, 3, 6, [1, 4, 8, 13, 16]);
    const towerB = buildWindows(178, 120, 4, 8, [2, 5, 9, 12, 18, 23, 27, 30]);
    const towerC = buildWindows(300, 196, 3, 5, [0, 4, 7, 11]);

    return (
        <div className="hero-scene" aria-hidden="true">
            <svg className="hero-scene__svg" viewBox="0 0 540 430" role="presentation">
                <rect x="20" y="360" width="480" height="30" rx="15" fill="var(--color-surface-raised)" />

                <rect x="62" y="150" width="96" height="214" rx="18" fill="var(--color-surface-hover)" />
                <rect x="164" y="100" width="116" height="264" rx="18" fill="var(--color-surface-raised)" />
                <rect x="286" y="176" width="92" height="188" rx="18" fill="var(--color-surface-hover)" />

                {[...towerA, ...towerB, ...towerC].map((window, index) => (
                    <rect
                        key={index}
                        x={window.x}
                        y={window.y}
                        width="14"
                        height="18"
                        rx="4"
                        className={window.lit ? "hero-scene__window hero-scene__window--lit" : "hero-scene__window"}
                        style={{ animationDelay: `${window.delay}s` }}
                    />
                ))}

                <path d="M372 250 440 196l68 54v114H372Z" fill="var(--color-primary)" />
                <path d="M358 256 440 190l82 66" fill="none" stroke="var(--color-text)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="420" y="296" width="40" height="68" rx="12" fill="var(--color-bg)" />
                <rect x="388" y="276" width="24" height="26" rx="8" fill="var(--color-accent)" />
                <rect x="468" y="276" width="24" height="26" rx="8" fill="var(--color-accent)" />

                <circle cx="40" cy="330" r="26" fill="var(--color-positive)" opacity="0.85" />
                <rect x="35" y="340" width="10" height="24" rx="4" fill="var(--color-surface-hover)" />
                <circle cx="496" cy="340" r="18" fill="var(--color-positive)" opacity="0.7" />
            </svg>

            <div className="hero-scene__card hero-scene__card--score">
                <svg viewBox="0 0 120 120" className="hero-scene__ring">
                    <circle cx="60" cy="60" r="46" fill="none" stroke="var(--color-surface-hover)" strokeWidth="14" />
                    <circle
                        cx="60" cy="60" r="46" fill="none" stroke="var(--color-accent)" strokeWidth="14" strokeLinecap="round"
                        strokeDasharray="289" strokeDashoffset="84" transform="rotate(-90 60 60)"
                    />
                </svg>
                <span className="hero-scene__card-label">Índice InmoDomain</span>
            </div>

            <div className="hero-scene__card hero-scene__card--bars">
                <div className="hero-scene__bars">
                    {[40, 62, 48, 78, 90].map((height, index) => (
                        <span key={index} style={{ height: `${height}%`, animationDelay: `${index * 0.12}s` }} />
                    ))}
                </div>
                <span className="hero-scene__card-label">Actividad</span>
            </div>

            <div className="hero-scene__chip">
                <TrendingUp size={16} />
                <span>Tendencia</span>
            </div>
        </div>
    );
}