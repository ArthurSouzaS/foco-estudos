"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TIMER_STORAGE_KEY } from "@/lib/constants";
import {
  applySettings,
  createTimerState,
  getProgress,
  getRemaining,
  isTimerState,
  pauseTimer,
  resetTimer,
  setTimerSubject,
  skipPhase,
  startTimer,
  tickTimer,
  type FinishedPhase,
  type TimerState,
} from "@/lib/pomodoro";
import type { PomodoroSettings } from "@/lib/types";
import { useLocalStorage } from "./useLocalStorage";

export interface PomodoroCallbacks {
  /** Chamado quando uma fase termina. `natural` é false quando o usuário pulou a fase. */
  onPhaseFinished?: (finished: FinishedPhase, natural: boolean) => void;
}

export interface PomodoroControls {
  timer: TimerState;
  remainingSec: number;
  progress: number;
  hydrated: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  setSubject: (subjectId: string | null) => void;
}

const validateTimer = (value: unknown) => (isTimerState(value) ? value : null);

/**
 * Estado do Pomodoro baseado em horário de término (`endsAt`), e não em contagem
 * de ticks: assim o tempo continua correto mesmo com a aba em segundo plano
 * ou após recarregar a página.
 */
export function usePomodoro(
  settings: PomodoroSettings,
  { onPhaseFinished }: PomodoroCallbacks = {},
  tickMs = 250,
): PomodoroControls {
  const [timer, setTimer, { hydrated }] = useLocalStorage<TimerState>(
    TIMER_STORAGE_KEY,
    () => createTimerState(settings),
    { validate: validateTimer },
  );
  const [now, setNow] = useState(() => Date.now());
  const callbackRef = useRef(onPhaseFinished);
  const handledEnd = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = onPhaseFinished;
  });

  // Relógio: só roda enquanto o timer está ativo.
  useEffect(() => {
    if (!hydrated || timer.status !== "rodando") return;
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [hydrated, timer.status, tickMs]);

  // Verifica se a fase terminou.
  useEffect(() => {
    if (!hydrated || timer.status !== "rodando") return;
    const { state, finished } = tickTimer(timer, settings, now);
    if (!finished || handledEnd.current === timer.endsAt) return;
    handledEnd.current = timer.endsAt;
    setTimer(state);
    callbackRef.current?.(finished, true);
  }, [hydrated, now, timer, settings, setTimer]);

  // Novas configurações valem para a fase atual se ela ainda não começou.
  useEffect(() => {
    if (hydrated) setTimer((t) => applySettings(t, settings));
  }, [hydrated, settings, setTimer]);

  const start = useCallback(() => {
    const at = Date.now();
    setNow(at);
    setTimer((t) => startTimer(t, at));
  }, [setTimer]);

  const pause = useCallback(() => setTimer((t) => pauseTimer(t, Date.now())), [setTimer]);

  const reset = useCallback(() => setTimer((t) => resetTimer(t, settings)), [setTimer, settings]);

  const skip = useCallback(() => {
    const { state, finished } = skipPhase(timer, settings, Date.now());
    setTimer(state);
    if (finished) callbackRef.current?.(finished, false);
  }, [timer, settings, setTimer]);

  const setSubject = useCallback(
    (subjectId: string | null) => setTimer((t) => setTimerSubject(t, subjectId)),
    [setTimer],
  );

  return {
    timer,
    remainingSec: getRemaining(timer, now),
    progress: getProgress(timer, now),
    hydrated,
    start,
    pause,
    reset,
    skip,
    setSubject,
  };
}
