import Link from "next/link";
import type { CSSProperties } from "react";
import { EmptyState } from "@/components/ui";
import { PRIORITY_LABELS } from "@/lib/constants";
import { formatShortDate } from "@/lib/date";
import { describeDaysLeft, type UpcomingTask } from "@/lib/stats";
import type { Subject } from "@/lib/types";
import styles from "./UpcomingTasks.module.scss";

interface UpcomingTasksProps {
  items: UpcomingTask[];
  subjects: Subject[];
  limit?: number;
}

export function UpcomingTasks({ items, subjects, limit = 6 }: UpcomingTasksProps) {
  if (items.length === 0) {
    return <EmptyState icon="🎯" title="Nada vencendo nos próximos 7 dias" description="Aproveite para adiantar os estudos!" />;
  }
  const byId = new Map(subjects.map((s) => [s.id, s]));
  return (
    <>
      <ul className={styles.list}>
        {items.slice(0, limit).map(({ task, daysLeft }) => {
          const subject = byId.get(task.subjectId);
          const tone = daysLeft < 0 ? "late" : daysLeft <= 1 ? "soon" : "ok";
          return (
            <li key={task.id} className={styles.item} style={{ "--color": subject?.color } as CSSProperties}>
              <div className={styles.info}>
                <p className={styles.title}>{task.title}</p>
                <p className={styles.meta}>
                  {subject?.name} · Prioridade {PRIORITY_LABELS[task.priority].toLowerCase()}
                </p>
              </div>
              <div className={styles.due} data-tone={tone}>
                <span>{describeDaysLeft(daysLeft)}</span>
                <time className="mono" dateTime={task.dueDate ?? undefined}>
                  {task.dueDate && formatShortDate(task.dueDate)}
                </time>
              </div>
            </li>
          );
        })}
      </ul>
      {items.length > limit && (
        <p className={styles.more}>
          <Link href="/tarefas/">Ver todas as {items.length} tarefas</Link>
        </p>
      )}
    </>
  );
}
