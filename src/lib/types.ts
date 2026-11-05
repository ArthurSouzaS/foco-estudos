/** Data no formato "AAAA-MM-DD" (horário local). */
export type DateKey = string;

export interface Subject {
  id: string;
  name: string;
  /** Cor em hexadecimal, ex.: "#34d399". */
  color: string;
  createdAt: string;
}

export type TaskStatus = "a-fazer" | "fazendo" | "feito";
export type TaskPriority = "baixa" | "media" | "alta";

export interface Task {
  id: string;
  subjectId: string;
  title: string;
  dueDate: DateKey | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
}

export interface StudySession {
  id: string;
  /** null quando a sessão não estava ligada a uma matéria (ou ela foi excluída). */
  subjectId: string | null;
  /** Início da sessão em ISO 8601. */
  startedAt: string;
  /** Duração estudada em segundos. */
  durationSec: number;
}

export interface PomodoroSettings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  /** Quantidade de ciclos de foco antes da pausa longa. */
  cyclesBeforeLongBreak: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface AppData {
  version: 1;
  subjects: Subject[];
  tasks: Task[];
  sessions: StudySession[];
  settings: PomodoroSettings;
}

export type SubjectInput = Pick<Subject, "name" | "color">;
export type TaskInput = Pick<Task, "subjectId" | "title" | "dueDate" | "priority"> &
  Partial<Pick<Task, "status">>;
