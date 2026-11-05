import type { AppData, PomodoroSettings, TaskPriority, TaskStatus } from "./types";

export const STORAGE_KEY = "foco-estudos:dados";
export const TIMER_STORAGE_KEY = "foco-estudos:timer";
export const DATA_VERSION = 1 as const;

export const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: false,
};

export const EMPTY_DATA: AppData = {
  version: DATA_VERSION,
  subjects: [],
  tasks: [],
  sessions: [],
  settings: DEFAULT_SETTINGS,
};

export const SUBJECT_COLORS = [
  "#34d399",
  "#38bdf8",
  "#a78bfa",
  "#f472b6",
  "#fbbf24",
  "#fb923c",
  "#f87171",
  "#2dd4bf",
] as const;

export const STATUS_LABELS: Record<TaskStatus, string> = {
  "a-fazer": "A fazer",
  fazendo: "Fazendo",
  feito: "Feito",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

export const TASK_STATUSES: TaskStatus[] = ["a-fazer", "fazendo", "feito"];
export const TASK_PRIORITIES: TaskPriority[] = ["alta", "media", "baixa"];
