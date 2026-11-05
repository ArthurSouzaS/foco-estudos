import { addDays, toDateKey } from "@/lib/date";
import styles from "./StreakCalendar.module.scss";

interface StreakCalendarProps {
  studiedDays: Set<string>;
  today: Date;
  days?: number;
}

/** Faixa dos últimos dias marcando em quais houve estudo. */
export function StreakCalendar({ studiedDays, today, days = 14 }: StreakCalendarProps) {
  const list = Array.from({ length: days }, (_, i) => addDays(today, i - days + 1));
  return (
    <ol className={styles.strip} aria-label={`Dias estudados nos últimos ${days} dias`}>
      {list.map((date) => {
        const key = toDateKey(date);
        const studied = studiedDays.has(key);
        const label = date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
        return (
          <li
            key={key}
            className={styles.day}
            data-studied={studied}
            data-today={key === toDateKey(today)}
            title={`${label}: ${studied ? "estudou" : "não estudou"}`}
          >
            <span className="visually-hidden">{`${label}: ${studied ? "estudou" : "não estudou"}`}</span>
          </li>
        );
      })}
    </ol>
  );
}
