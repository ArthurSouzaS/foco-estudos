import type { DateKey } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Converte uma data para a chave "AAAA-MM-DD" no fuso local. */
export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Converte "AAAA-MM-DD" em Date (meia-noite local). */
export function parseDateKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function isDateKey(value: unknown): value is DateKey {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toDateKey(parseDateKey(value)) === value;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

/** Diferença em dias inteiros entre duas chaves (b - a). */
export function diffInDays(a: DateKey, b: DateKey): number {
  const ms = parseDateKey(b).getTime() - parseDateKey(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Segunda-feira da semana da data informada. */
export function startOfWeek(date: Date): Date {
  const day = date.getDay(); // 0 = domingo
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
}

export const WEEKDAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

/** Formata "AAAA-MM-DD" como "05/11". */
export function formatShortDate(key: DateKey): string {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

/** Formata segundos como "1h 25min", "40min" ou "0min". */
export function formatDuration(totalSec: number): string {
  const totalMin = Math.floor(totalSec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

/** Formata segundos como "MM:SS". */
export function formatClock(totalSec: number): string {
  const safe = Math.max(0, Math.ceil(totalSec));
  return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`;
}
