import type { PomodoroSettings } from "./types";

export type TimerPhase = "foco" | "pausa-curta" | "pausa-longa";
export type TimerStatus = "parado" | "rodando" | "pausado";

export interface TimerState {
  phase: TimerPhase;
  status: TimerStatus;
  /** Duração total da fase atual, em segundos. */
  durationSec: number;
  /** Segundos restantes quando o timer não está rodando. */
  remainingSec: number;
  /** Momento (ms desde epoch) em que a fase termina, quando está rodando. */
  endsAt: number | null;
  /** Quantos ciclos de foco já foram concluídos. */
  completedFocus: number;
  subjectId: string | null;
  /** Quando o foco atual começou (ISO), para registrar a sessão. */
  focusStartedAt: string | null;
}

export interface FinishedPhase {
  phase: TimerPhase;
  /** Segundos efetivamente estudados (apenas para a fase de foco). */
  studiedSec: number;
  startedAt: string;
  subjectId: string | null;
}

export interface TimerTransition {
  state: TimerState;
  finished: FinishedPhase | null;
}

/** Foco interrompido com menos que isso não é registrado. */
export const MIN_RECORDED_SEC = 60;

export const PHASE_LABELS: Record<TimerPhase, string> = {
  foco: "Foco",
  "pausa-curta": "Pausa curta",
  "pausa-longa": "Pausa longa",
};

export function phaseDuration(phase: TimerPhase, settings: PomodoroSettings): number {
  const minutes =
    phase === "foco"
      ? settings.focusMin
      : phase === "pausa-curta"
        ? settings.shortBreakMin
        : settings.longBreakMin;
  return Math.round(minutes * 60);
}

export function createTimerState(
  settings: PomodoroSettings,
  subjectId: string | null = null,
  phase: TimerPhase = "foco",
): TimerState {
  const durationSec = phaseDuration(phase, settings);
  return {
    phase,
    status: "parado",
    durationSec,
    remainingSec: durationSec,
    endsAt: null,
    completedFocus: 0,
    subjectId,
    focusStartedAt: null,
  };
}

export function getRemaining(state: TimerState, now: number): number {
  if (state.status === "rodando" && state.endsAt !== null) {
    return Math.max(0, (state.endsAt - now) / 1000);
  }
  return state.remainingSec;
}

/** Progresso da fase atual entre 0 e 1. */
export function getProgress(state: TimerState, now: number): number {
  if (state.durationSec <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - getRemaining(state, now) / state.durationSec));
}

export function startTimer(state: TimerState, now: number): TimerState {
  if (state.status === "rodando" || state.remainingSec <= 0) return state;
  return {
    ...state,
    status: "rodando",
    endsAt: now + state.remainingSec * 1000,
    focusStartedAt:
      state.phase === "foco" ? (state.focusStartedAt ?? new Date(now).toISOString()) : null,
  };
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.status !== "rodando") return state;
  return { ...state, status: "pausado", remainingSec: getRemaining(state, now), endsAt: null };
}

/** Volta a fase atual ao início, sem registrar nada. */
export function resetTimer(state: TimerState, settings: PomodoroSettings): TimerState {
  const durationSec = phaseDuration(state.phase, settings);
  return {
    ...state,
    status: "parado",
    durationSec,
    remainingSec: durationSec,
    endsAt: null,
    focusStartedAt: null,
  };
}

function nextPhaseState(state: TimerState, settings: PomodoroSettings): TimerState {
  let phase: TimerPhase = "foco";
  let completedFocus = state.completedFocus;
  if (state.phase === "foco") {
    completedFocus += 1;
    const cycles = Math.max(1, settings.cyclesBeforeLongBreak);
    phase = completedFocus % cycles === 0 ? "pausa-longa" : "pausa-curta";
  }
  const durationSec = phaseDuration(phase, settings);
  return {
    ...state,
    phase,
    status: "parado",
    durationSec,
    remainingSec: durationSec,
    endsAt: null,
    completedFocus,
    focusStartedAt: null,
  };
}

function finishedInfo(state: TimerState, studiedSec: number, now: number): FinishedPhase {
  return {
    phase: state.phase,
    studiedSec: state.phase === "foco" ? Math.round(studiedSec) : 0,
    startedAt: state.focusStartedAt ?? new Date(now - studiedSec * 1000).toISOString(),
    subjectId: state.subjectId,
  };
}

/**
 * Deve ser chamada periodicamente. Quando o tempo acaba, informa a fase concluída
 * e prepara a próxima (parada, aguardando o usuário iniciar).
 */
export function tickTimer(
  state: TimerState,
  settings: PomodoroSettings,
  now: number,
): TimerTransition {
  if (state.status !== "rodando" || getRemaining(state, now) > 0) {
    return { state, finished: null };
  }
  return {
    state: nextPhaseState(state, settings),
    finished: finishedInfo(state, state.durationSec, now),
  };
}

/**
 * Pula para a próxima fase. Se for um foco com pelo menos MIN_RECORDED_SEC
 * estudados, o tempo parcial é informado para ser registrado.
 */
export function skipPhase(
  state: TimerState,
  settings: PomodoroSettings,
  now: number,
): TimerTransition {
  const studied = state.durationSec - getRemaining(state, now);
  const shouldRecord = state.phase === "foco" && studied >= MIN_RECORDED_SEC;
  return {
    state: nextPhaseState(state, settings),
    finished: shouldRecord ? finishedInfo(state, studied, now) : null,
  };
}

export function setTimerSubject(state: TimerState, subjectId: string | null): TimerState {
  return { ...state, subjectId };
}

/** Aplica novas configurações: só altera a duração se a fase ainda não começou. */
export function applySettings(state: TimerState, settings: PomodoroSettings): TimerState {
  if (state.status !== "parado") return state;
  const durationSec = phaseDuration(state.phase, settings);
  if (state.durationSec === durationSec && state.remainingSec === durationSec) return state;
  return { ...state, durationSec, remainingSec: durationSec };
}

export function isTimerState(value: unknown): value is TimerState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    ["foco", "pausa-curta", "pausa-longa"].includes(v.phase as string) &&
    ["parado", "rodando", "pausado"].includes(v.status as string) &&
    typeof v.durationSec === "number" &&
    typeof v.remainingSec === "number" &&
    (v.endsAt === null || typeof v.endsAt === "number") &&
    typeof v.completedFocus === "number" &&
    (v.subjectId === null || typeof v.subjectId === "string") &&
    (v.focusStartedAt === null || typeof v.focusStartedAt === "string")
  );
}
