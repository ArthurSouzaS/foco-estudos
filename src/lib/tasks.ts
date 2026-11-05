import { PRIORITY_WEIGHT } from "./constants";
import type { Task, TaskPriority, TaskStatus } from "./types";

export interface TaskFilters {
  subjectId: string | "todas";
  status: TaskStatus | "todos";
  priority: TaskPriority | "todas";
  search: string;
}

export const DEFAULT_FILTERS: TaskFilters = {
  subjectId: "todas",
  status: "todos",
  priority: "todas",
  search: "",
};

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const term = normalize(filters.search);
  return tasks.filter(
    (t) =>
      (filters.subjectId === "todas" || t.subjectId === filters.subjectId) &&
      (filters.status === "todos" || t.status === filters.status) &&
      (filters.priority === "todas" || t.priority === filters.priority) &&
      (!term || normalize(t.title).includes(term)),
  );
}

/** Ordena: não concluídas primeiro, depois prazo mais próximo (sem prazo por último) e prioridade. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const doneDiff = Number(a.status === "feito") - Number(b.status === "feito");
    if (doneDiff !== 0) return doneDiff;
    if (a.dueDate !== b.dueDate) {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    }
    return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  });
}
