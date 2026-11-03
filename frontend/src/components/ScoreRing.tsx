import { formatIndex, scoreTone } from "../utils/format";

interface ScoreRingProps {
    value: number | null;
    size?: number;
    label?: string;
}

// Anillo que representa una puntuación de 0 a 100; el color depende del tramo (alta, media, baja).
export function ScoreRing({ value, size = 132, label = "Score" }: ScoreRingProps) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const progress = value == null ? 0 : Math.min(Math.max(value, 0), 100) / 100;

    return (
        <div className={`score-ring score-ring--${scoreTone(value)}`} style={{ width: size, height: size }}>
            <svg viewBox="0 0 120 120" role="img" aria-label={`${label}: ${formatIndex(value)} sobre 100`}>
                <circle className="score-ring__track" cx="60" cy="60" r={radius} />
                <circle
                    className="score-ring__value"
                    cx="60"
                    cy="60"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    transform="rotate(-90 60 60)"
                />
            </svg>
            <div className="score-ring__text">
                <strong className="score-ring__number">{value == null ? "—" : Math.round(value)}</strong>
                <span className="score-ring__label">{label}</span>
            </div>
        </div>
    );
}