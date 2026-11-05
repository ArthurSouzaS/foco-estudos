import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./constants";
import {
  applySettings,
  createTimerState,
  getProgress,
  getRemaining,
  isTimerState,
  pauseTimer,
  resetTimer,
  skipPhase,
  startTimer,
  tickTimer,
} from "./pomodoro";

const settings = { ...DEFAULT_SETTINGS, cyclesBeforeLongBreak: 2 };
const T0 = new Date(2026, 10, 5, 10, 0, 0).getTime();
const min = (n: number) => n * 60_000;

describe("timer Pomodoro", () => {
  it("começa parado com 25 minutos de foco", () => {
    const state = createTimerState(settings, "mat-1");
    expect(state).toMatchObject({ phase: "foco", status: "parado", durationSec: 1500, remainingSec: 1500 });
    expect(getRemaining(state, T0)).toBe(1500);
  });

  it("conta o tempo a partir do horário de término", () => {
    const running = startTimer(createTimerState(settings), T0);
    expect(running.status).toBe("rodando");
    expect(running.focusStartedAt).toBe(new Date(T0).toISOString());
    expect(getRemaining(running, T0 + min(10))).toBe(900);
    expect(getProgress(running, T0 + min(10))).toBeCloseTo(0.4);
  });

  it("pausa e continua sem perder tempo", () => {
    let state = startTimer(createTimerState(settings), T0);
    state = pauseTimer(state, T0 + min(5));
    expect(state).toMatchObject({ status: "pausado", remainingSec: 1200, endsAt: null });
    // Tempo parado não conta.
    expect(getRemaining(state, T0 + min(60))).toBe(1200);
    state = startTimer(state, T0 + min(60));
    expect(getRemaining(state, T0 + min(70))).toBe(600);
    // O início do foco é preservado.
    expect(state.focusStartedAt).toBe(new Date(T0).toISOString());
  });

  it("não faz nada no tick antes do fim", () => {
    const state = startTimer(createTimerState(settings), T0);
    expect(tickTimer(state, settings, T0 + min(24))).toEqual({ state, finished: null });
  });

  it("ao terminar o foco informa a sessão e vai para a pausa curta", () => {
    const state = startTimer(createTimerState(settings, "mat-1"), T0);
    const { state: next, finished } = tickTimer(state, settings, T0 + min(25) + 300);
    expect(finished).toEqual({
      phase: "foco",
      studiedSec: 1500,
      startedAt: new Date(T0).toISOString(),
      subjectId: "mat-1",
    });
    expect(next).toMatchObject({
      phase: "pausa-curta",
      status: "parado",
      durationSec: 300,
      completedFocus: 1,
      subjectId: "mat-1",
    });
  });

  it("alterna para pausa longa após N ciclos e volta para o foco", () => {
    let state = createTimerState(settings);
    const phases: string[] = [];
    let now = T0;
    for (let i = 0; i < 4; i++) {
      state = startTimer(state, now);
      now += state.durationSec * 1000;
      state = tickTimer(state, settings, now).state;
      phases.push(state.phase);
    }
    expect(phases).toEqual(["pausa-curta", "foco", "pausa-longa", "foco"]);
    expect(state.completedFocus).toBe(2);
  });

  it("pausas não geram tempo estudado", () => {
    const pause = startTimer(createTimerState(settings, null, "pausa-curta"), T0);
    const { finished } = tickTimer(pause, settings, T0 + min(5));
    expect(finished).toMatchObject({ phase: "pausa-curta", studiedSec: 0 });
  });

  it("pular um foco registra o tempo parcial (a partir de 1 minuto)", () => {
    const state = startTimer(createTimerState(settings), T0);
    expect(skipPhase(state, settings, T0 + 30_000).finished).toBeNull();
    const { state: next, finished } = skipPhase(state, settings, T0 + min(10));
    expect(finished?.studiedSec).toBe(600);
    expect(next.phase).toBe("pausa-curta");
  });

  it("reiniciar volta ao início da fase", () => {
    const state = resetTimer(pauseTimer(startTimer(createTimerState(settings), T0), T0 + min(3)), settings);
    expect(state).toMatchObject({ status: "parado", remainingSec: 1500, focusStartedAt: null });
  });

  it("aplica configurações novas apenas com o timer parado", () => {
    const custom = { ...settings, focusMin: 50 };
    expect(applySettings(createTimerState(settings), custom).remainingSec).toBe(3000);
    const running = startTimer(createTimerState(settings), T0);
    expect(applySettings(running, custom)).toBe(running);
    // Sem mudança real, devolve a mesma referência (evita renderizações em loop).
    const idle = createTimerState(settings);
    expect(applySettings(idle, { ...settings })).toBe(idle);
  });

  it("valida o estado salvo", () => {
    expect(isTimerState(createTimerState(settings))).toBe(true);
    expect(isTimerState({ phase: "foco" })).toBe(false);
    expect(isTimerState(null)).toBe(false);
  });
});
