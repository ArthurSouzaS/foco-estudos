import { EMPTY_DATA } from "@/lib/constants";
import type { AppData, StudySession, Subject, Task } from "@/lib/types";

export const subject = (overrides: Partial<Subject> = {}): Subject => ({
  id: "mat-1",
  name: "Banco de Dados",
  color: "#34d399",
  createdAt: "2026-11-01T12:00:00.000Z",
  ...overrides,
});

export const task = (overrides: Partial<Task> = {}): Task => ({
  id: "tar-1",
  subjectId: "mat-1",
  title: "Lista de SQL",
  dueDate: null,
  priority: "media",
  status: "a-fazer",
  createdAt: "2026-11-01T12:00:00.000Z",
  ...overrides,
});

/** Cria uma sessão em horário local (ano, mês 1-12, dia, hora). */
export const session = (
  date: [number, number, number, number?],
  durationMin: number,
  subjectId: string | null = "mat-1",
  id = `ses-${date.join("-")}-${durationMin}-${subjectId}`,
): StudySession => ({
  id,
  subjectId,
  startedAt: new Date(date[0], date[1] - 1, date[2], date[3] ?? 10).toISOString(),
  durationSec: durationMin * 60,
});

export const appData = (overrides: Partial<AppData> = {}): AppData => ({
  ...EMPTY_DATA,
  ...overrides,
});
