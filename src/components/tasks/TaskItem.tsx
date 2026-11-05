"use client";

import type { CSSProperties } from "react";
import { EditIcon, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { PRIORITY_LABELS, STATUS_LABELS, TASK_STATUSES } from "@/lib/constants";
import { diffInDays, formatShortDate, toDateKey } from "@/lib/date";
import { describeDaysLeft } from "@/lib/stats";
import type { Subject, Task, TaskStatus } from "@/lib/types";
import styles from "./TaskItem.module.scss";

interface TaskItemProps {
  task: Task;
  subject?: Subject;
  today?: Date;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskItem({ task, subject, today = new Date(), onStatusChange, onEdit, onDelete }: TaskItemProps) {
  const done = task.status === "feito";
  const daysLeft = task.dueDate ? diffInDays(toDateKey(today), task.dueDate) : null;
  const dueTone = done || daysLeft === null ? "neutral" : daysLeft < 0 ? "late" : daysLeft <= 2 ? "soon" : "neutral";

  return (
    <li
      className={styles.item}
      data-status={task.status}
      style={{ "--subject": subject?.color ?? "var(--border-strong)" } as CSSProperties}
    >
      <input
        type="checkbox"
        className={styles.check}
        checked={done}
        onChange={(e) => onStatusChange(e.target.checked ? "feito" : "a-fazer")}
        aria-label={done ? `Marcar "${task.title}" como não concluída` : `Concluir "${task.title}"`}
      />

      <div className={styles.body}>
        <p className={styles.title}>{task.title}</p>
        <div className={styles.meta}>
          <span className={styles.subject}>
            <span className={styles.subjectDot} aria-hidden="true" />
            {subject?.name ?? "Sem matéria"}
          </span>
          <span className={styles.priority} data-priority={task.priority}>
            Prioridade {PRIORITY_LABELS[task.priority].toLowerCase()}
          </span>
          {task.dueDate && daysLeft !== null && (
            <span className={styles.due} data-tone={dueTone}>
              <time dateTime={task.dueDate}>{formatShortDate(task.dueDate)}</time>
              {!done && ` · ${describeDaysLeft(daysLeft)}`}
            </span>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        <label className="visually-hidden" htmlFor={`status-${task.id}`}>
          Status de {task.title}
        </label>
        <select
          id={`status-${task.id}`}
          className={styles.status}
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="sm" iconOnly aria-label={`Editar "${task.title}"`} onClick={onEdit}>
          <EditIcon size={16} />
        </Button>
        <Button variant="ghost" size="sm" iconOnly aria-label={`Excluir "${task.title}"`} onClick={onDelete}>
          <TrashIcon size={16} />
        </Button>
      </div>
    </li>
  );
}
