import type { ReactNode } from "react";
import type { TimerPhase } from "@/lib/pomodoro";
import styles from "./TimerRing.module.scss";

interface TimerRingProps {
  progress: number;
  phase: TimerPhase;
  children: ReactNode;
}

const SIZE = 280;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Anel de progresso em SVG puro. */
export function TimerRing({ progress, phase, children }: TimerRingProps) {
  return (
    <div className={styles.ring} data-phase={phase}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
        <circle className={styles.track} cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
        <circle
          className={styles.bar}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
