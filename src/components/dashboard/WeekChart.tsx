import { formatDuration, formatShortDate } from "@/lib/date";
import type { WeekdayTotal } from "@/lib/stats";
import styles from "./WeekChart.module.scss";

interface WeekChartProps {
  days: WeekdayTotal[];
  todayKey: string;
}

const WIDTH = 480;
const HEIGHT = 220;
const PAD = { top: 16, right: 8, bottom: 36, left: 44 };

/** Escolhe um teto "redondo" (em minutos) para o eixo Y. */
function niceMaxMinutes(maxMinutes: number): number {
  const steps = [30, 60, 90, 120, 180, 240, 360, 480, 600, 720];
  return steps.find((s) => s >= maxMinutes) ?? Math.ceil(maxMinutes / 120) * 120;
}

/** Gráfico de barras empilhadas (por matéria) em SVG puro. */
export function WeekChart({ days, todayKey }: WeekChartProps) {
  const maxMinutes = niceMaxMinutes(Math.max(...days.map((d) => d.seconds / 60), 1));
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / days.length;
  const barW = Math.min(36, slot * 0.6);
  const y = (minutes: number) => PAD.top + plotH - (minutes / maxMinutes) * plotH;
  const ticks = [0, 0.5, 1].map((f) => Math.round(maxMinutes * f));
  const total = days.reduce((sum, d) => sum + d.seconds, 0);

  const summary = days.map((d) => `${d.label}: ${formatDuration(d.seconds)}`).join(", ");

  return (
    <figure className={styles.figure}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={`Tempo estudado nesta semana. Total ${formatDuration(total)}. ${summary}.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={PAD.left - 8} y={y(t)} className={styles.axis} textAnchor="end" dominantBaseline="middle">
              {t >= 60 ? `${+(t / 60).toFixed(1)}h` : `${t}m`}
            </text>
          </g>
        ))}

        {days.map((day, i) => {
          const x = PAD.left + slot * i + (slot - barW) / 2;
          let cursor = 0;
          const isToday = day.date === todayKey;
          return (
            <g key={day.date}>
              <title>{`${day.label} (${formatShortDate(day.date)}): ${formatDuration(day.seconds)}`}</title>
              {day.seconds === 0 && (
                <rect x={x} y={y(0) - 3} width={barW} height={3} rx={1.5} className={styles.empty} />
              )}
              {day.segments.map((seg) => {
                const minutes = seg.seconds / 60;
                const top = y(cursor + minutes);
                const height = y(cursor) - top;
                cursor += minutes;
                return (
                  <rect
                    key={seg.subjectId ?? "none"}
                    x={x}
                    y={top}
                    width={barW}
                    height={Math.max(height, 0)}
                    fill={seg.color}
                    className={styles.bar}
                  />
                );
              })}
              <text
                x={x + barW / 2}
                y={HEIGHT - PAD.bottom + 18}
                textAnchor="middle"
                className={isToday ? styles.labelToday : styles.label}
              >
                {day.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="visually-hidden">Tempo estudado por dia da semana, empilhado por matéria.</figcaption>
    </figure>
  );
}
