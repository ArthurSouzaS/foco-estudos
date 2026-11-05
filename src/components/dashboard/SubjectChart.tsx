import type { CSSProperties } from "react";
import { formatDuration } from "@/lib/date";
import type { SubjectTotal } from "@/lib/stats";
import styles from "./SubjectChart.module.scss";

/** Barras horizontais em CSS com o tempo total por matéria. */
export function SubjectChart({ totals }: { totals: SubjectTotal[] }) {
  const max = Math.max(...totals.map((t) => t.seconds), 1);
  const sum = totals.reduce((acc, t) => acc + t.seconds, 0);

  return (
    <ul className={styles.list} aria-label="Tempo estudado por matéria">
      {totals.map((t) => {
        const percent = sum > 0 ? Math.round((t.seconds / sum) * 100) : 0;
        return (
          <li key={t.subjectId ?? "none"} className={styles.row} style={{ "--color": t.color } as CSSProperties}>
            <div className={styles.labels}>
              <span className={styles.name}>
                <span className={styles.dot} aria-hidden="true" />
                {t.name}
              </span>
              <span className={styles.value}>
                {formatDuration(t.seconds)} <span className={styles.percent}>({percent}%)</span>
              </span>
            </div>
            <div className={styles.track} aria-hidden="true">
              <div className={styles.bar} style={{ width: `${(t.seconds / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
