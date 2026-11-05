import { PRIORITY_WEIGHT } from "./constants";
import { addDays, diffInDays, startOfWeek, toDateKey, WEEKDAY_SHORT } from "./date";
import type { DateKey, StudySession, Subject, Task } from "./types";

export const NO_SUBJECT_LABEL = "Sem matéria";
export const NO_SUBJECT_COLOR = "#64748b";

export interface SubjectTotal {
  subjectId: string | null;
  name: string;
  color: string;
  seconds: number;
}

export interface DaySegment {
  subjectId: string | null;
  color: string;
  seconds: number;
}

export interface WeekdayTotal {
  date: DateKey;
  label: string;
  seconds: number;
  segments: DaySegment[];
}

export interface StreakInfo {
  current: number;
  longest: number;
  studiedToday: boolean;
}

export interface UpcomingTask {
  task: Task;
  daysLeft: number;
}

const sessionDay = (s: StudySession) => toDateKey(new Date(s.startedAt));

function subjectLookup(subjects: Subject[]) {
  const map = new Map(subjects.map((s) => [s.id, s]));
  return (id: string | null) => {
    const subject = id ? map.get(id) : undefined;
    return {
      subjectId: subject ? subject.id : null,
      name: subject?.name ?? NO_SUBJECT_LABEL,
      color: subject?.color ?? NO_SUBJECT_COLOR,
    };
  };
}

/** Tempo total estudado por matéria, do maior para o menor. Sessões órfãs vão para "Sem matéria". */
export function totalsBySubject(sessions: StudySession[], subjects: Subject[]): SubjectTotal[] {
  const lookup = subjectLookup(subjects);
  const totals = new Map<string, SubjectTotal>();
  for (const session of sessions) {
    const info = lookup(session.subjectId);
    const key = info.subjectId ?? "__none__";
    const current = totals.get(key) ?? { ...info, seconds: 0 };
    current.seconds += session.durationSec;
    totals.set(key, current);
  }
  return [...totals.values()].sort((a, b) => b.seconds - a.seconds);
}

/** Tempo estudado em cada dia da semana (segunda a domingo) que contém `reference`. */
export function weekTotals(
  sessions: StudySession[],
  subjects: Subject[],
  reference: Date = new Date(),
): WeekdayTotal[] {
  const lookup = subjectLookup(subjects);
  const monday = startOfWeek(reference);
  const days: WeekdayTotal[] = WEEKDAY_SHORT.map((label, i) => ({
    date: toDateKey(addDays(monday, i)),
    label,
    seconds: 0,
    segments: [],
  }));
  const byDate = new Map(days.map((d) => [d.date, d]));

  for (const session of sessions) {
    const day = byDate.get(sessionDay(session));
    if (!day) continue;
    const info = lookup(session.subjectId);
    day.seconds += session.durationSec;
    const segment = day.segments.find((s) => s.subjectId === info.subjectId);
    if (segment) segment.seconds += session.durationSec;
    else day.segments.push({ subjectId: info.subjectId, color: info.color, seconds: session.durationSec });
  }
  return days;
}

/** Soma dos segundos estudados no dia informado. */
export function totalOnDay(sessions: StudySession[], day: DateKey): number {
  return sessions.reduce((sum, s) => (sessionDay(s) === day ? sum + s.durationSec : sum), 0);
}

/**
 * Sequência de dias estudados.
 * A sequência atual continua valendo se a pessoa estudou ontem e ainda não estudou hoje.
 */
export function calculateStreak(sessions: StudySession[], today: Date = new Date()): StreakInfo {
  const days = [...new Set(sessions.filter((s) => s.durationSec > 0).map(sessionDay))].sort();
  const todayKey = toDateKey(today);

  let longest = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && diffInDays(days[i - 1]!, days[i]!) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const studiedToday = days.includes(todayKey);
  let current = 0;
  let cursor = studiedToday ? today : addDays(today, -1);
  const set = new Set(days);
  while (set.has(toDateKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }

  return { current, longest, studiedToday };
}

/** Tarefas não concluídas com prazo vencido ou nos próximos `withinDays` dias. */
export function upcomingTasks(
  tasks: Task[],
  today: Date = new Date(),
  withinDays = 7,
): UpcomingTask[] {
  const todayKey = toDateKey(today);
  return tasks
    .filter((t): t is Task & { dueDate: DateKey } => t.status !== "feito" && t.dueDate !== null)
    .map((task) => ({ task, daysLeft: diffInDays(todayKey, task.dueDate) }))
    .filter(({ daysLeft }) => daysLeft <= withinDays)
    .sort(
      (a, b) =>
        a.daysLeft - b.daysLeft || PRIORITY_WEIGHT[a.task.priority] - PRIORITY_WEIGHT[b.task.priority],
    );
}

/** Texto amigável para o prazo: "Atrasada há 2 dias", "Hoje", "Amanhã", "Em 3 dias". */
export function describeDaysLeft(daysLeft: number): string {
  if (daysLeft < -1) return `Atrasada há ${-daysLeft} dias`;
  if (daysLeft === -1) return "Atrasada há 1 dia";
  if (daysLeft === 0) return "Hoje";
  if (daysLeft === 1) return "Amanhã";
  return `Em ${daysLeft} dias`;
}
