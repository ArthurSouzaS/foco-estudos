"use client";

import { Button, SelectField, TextField } from "@/components/ui";
import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { DEFAULT_FILTERS, type TaskFilters as Filters } from "@/lib/tasks";
import type { Subject, TaskPriority, TaskStatus } from "@/lib/types";
import styles from "./TaskFilters.module.scss";

interface TaskFiltersProps {
  subjects: Subject[];
  filters: Filters;
  counts: Record<TaskStatus | "todos", number>;
  onChange: (filters: Filters) => void;
}

export function TaskFilters({ subjects, filters, counts, onChange }: TaskFiltersProps) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value });
  const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);
  const statusOptions: (TaskStatus | "todos")[] = ["todos", ...TASK_STATUSES];

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs} role="group" aria-label="Filtrar por status">
        {statusOptions.map((status) => (
          <button
            key={status}
            type="button"
            className={styles.tab}
            aria-pressed={filters.status === status}
            onClick={() => set("status", status)}
          >
            {status === "todos" ? "Todas" : STATUS_LABELS[status]}
            <span className={styles.badge}>{counts[status]}</span>
          </button>
        ))}
      </div>

      <div className={styles.fields}>
        <TextField
          label="Buscar"
          type="search"
          placeholder="Buscar tarefa…"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
        />
        <SelectField label="Matéria" value={filters.subjectId} onChange={(e) => set("subjectId", e.target.value)}>
          <option value="todas">Todas</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Prioridade"
          value={filters.priority}
          onChange={(e) => set("priority", e.target.value as TaskPriority | "todas")}
        >
          <option value="todas">Todas</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </SelectField>
        <Button variant="ghost" className={styles.clear} disabled={isDefault} onClick={() => onChange(DEFAULT_FILTERS)}>
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
