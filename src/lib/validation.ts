import { DATA_VERSION, DEFAULT_SETTINGS } from "./constants";
import { isDateKey } from "./date";
import type { AppData, PomodoroSettings, StudySession, Subject, Task } from "./types";

export type ValidationResult = { ok: true; data: AppData } | { ok: false; error: string };

type UnknownRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === "string";
const isNonEmpty = (v: unknown): v is string => isString(v) && v.trim().length > 0;
const isColor = (v: unknown): v is string => isString(v) && /^#[0-9a-fA-F]{6}$/.test(v);
const isIsoDate = (v: unknown): v is string => isString(v) && !Number.isNaN(Date.parse(v));

function isSubject(v: unknown): v is Subject {
  return isRecord(v) && isNonEmpty(v.id) && isNonEmpty(v.name) && isColor(v.color) && isIsoDate(v.createdAt);
}

function isTask(v: unknown): v is Task {
  return (
    isRecord(v) &&
    isNonEmpty(v.id) &&
    isNonEmpty(v.subjectId) &&
    isNonEmpty(v.title) &&
    (v.dueDate === null || isDateKey(v.dueDate)) &&
    ["baixa", "media", "alta"].includes(v.priority as string) &&
    ["a-fazer", "fazendo", "feito"].includes(v.status as string) &&
    isIsoDate(v.createdAt)
  );
}

function isSession(v: unknown): v is StudySession {
  return (
    isRecord(v) &&
    isNonEmpty(v.id) &&
    (v.subjectId === null || isNonEmpty(v.subjectId)) &&
    isIsoDate(v.startedAt) &&
    typeof v.durationSec === "number" &&
    Number.isFinite(v.durationSec) &&
    v.durationSec >= 0
  );
}

function parseSettings(v: unknown): PomodoroSettings {
  if (!isRecord(v)) return DEFAULT_SETTINGS;
  const num = (key: keyof PomodoroSettings, min: number, max: number) => {
    const value = v[key];
    return typeof value === "number" && value >= min && value <= max
      ? value
      : (DEFAULT_SETTINGS[key] as number);
  };
  const bool = (key: keyof PomodoroSettings) =>
    typeof v[key] === "boolean" ? (v[key] as boolean) : (DEFAULT_SETTINGS[key] as boolean);
  return {
    focusMin: num("focusMin", 1, 180),
    shortBreakMin: num("shortBreakMin", 1, 60),
    longBreakMin: num("longBreakMin", 1, 120),
    cyclesBeforeLongBreak: num("cyclesBeforeLongBreak", 1, 12),
    soundEnabled: bool("soundEnabled"),
    notificationsEnabled: bool("notificationsEnabled"),
  };
}

function checkList<T>(list: unknown, guard: (v: unknown) => v is T, label: string): T[] | string {
  if (!Array.isArray(list)) return `O campo "${label}" precisa ser uma lista.`;
  const index = list.findIndex((item) => !guard(item));
  if (index >= 0) return `Item ${index + 1} de "${label}" é inválido.`;
  return list as T[];
}

/** Valida um objeto desconhecido (ex.: JSON importado) e devolve dados prontos para uso. */
export function validateAppData(input: unknown): ValidationResult {
  if (!isRecord(input)) return { ok: false, error: "O arquivo não contém um objeto JSON válido." };
  if (input.version !== DATA_VERSION) {
    return { ok: false, error: "Versão do arquivo não suportada." };
  }

  const subjects = checkList(input.subjects, isSubject, "subjects");
  if (typeof subjects === "string") return { ok: false, error: subjects };
  const tasks = checkList(input.tasks, isTask, "tasks");
  if (typeof tasks === "string") return { ok: false, error: tasks };
  const sessions = checkList(input.sessions, isSession, "sessions");
  if (typeof sessions === "string") return { ok: false, error: sessions };

  const subjectIds = new Set(subjects.map((s) => s.id));
  if (subjectIds.size !== subjects.length) return { ok: false, error: "Há matérias com ID repetido." };
  const orphan = tasks.find((t) => !subjectIds.has(t.subjectId));
  if (orphan) return { ok: false, error: `A tarefa "${orphan.title}" aponta para uma matéria inexistente.` };

  return {
    ok: true,
    data: {
      version: DATA_VERSION,
      subjects,
      tasks,
      sessions: sessions.map((s) =>
        s.subjectId && !subjectIds.has(s.subjectId) ? { ...s, subjectId: null } : s,
      ),
      settings: parseSettings(input.settings),
    },
  };
}

/** Converte o texto de um arquivo JSON em dados validados. */
export function parseBackup(text: string): ValidationResult {
  try {
    return validateAppData(JSON.parse(text));
  } catch {
    return { ok: false, error: "O arquivo não é um JSON válido." };
  }
}

export function serializeBackup(data: AppData): string {
  return JSON.stringify(data, null, 2);
}
