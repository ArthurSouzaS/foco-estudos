import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, TIMER_STORAGE_KEY } from "@/lib/constants";
import { usePomodoro } from "./usePomodoro";

const settings = { ...DEFAULT_SETTINGS, focusMin: 1, shortBreakMin: 1 };

describe("usePomodoro", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 5, 10, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("conta regressivamente e avisa ao concluir o foco uma única vez", () => {
    const onPhaseFinished = vi.fn();
    const { result } = renderHook(() => usePomodoro(settings, { onPhaseFinished }));

    act(() => result.current.setSubject("mat-1"));
    act(() => result.current.start());
    expect(result.current.timer.status).toBe("rodando");

    act(() => vi.advanceTimersByTime(30_000));
    expect(Math.round(result.current.remainingSec)).toBe(30);

    act(() => vi.advanceTimersByTime(31_000));
    expect(onPhaseFinished).toHaveBeenCalledTimes(1);
    expect(onPhaseFinished).toHaveBeenCalledWith(
      expect.objectContaining({ phase: "foco", studiedSec: 60, subjectId: "mat-1" }),
      true,
    );
    expect(result.current.timer).toMatchObject({ phase: "pausa-curta", status: "parado" });

    act(() => vi.advanceTimersByTime(5_000));
    expect(onPhaseFinished).toHaveBeenCalledTimes(1);
  });

  it("pausa e continua", () => {
    const { result } = renderHook(() => usePomodoro(settings));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(20_000));
    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.timer.status).toBe("pausado");
    expect(Math.round(result.current.remainingSec)).toBe(40);
  });

  it("pular um foco parcial informa natural = false", () => {
    const onPhaseFinished = vi.fn();
    const { result } = renderHook(() => usePomodoro({ ...settings, focusMin: 25 }, { onPhaseFinished }));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(5 * 60_000));
    act(() => result.current.skip());
    expect(onPhaseFinished).toHaveBeenCalledWith(expect.objectContaining({ studiedSec: 300 }), false);
  });

  it("retoma um timer salvo que terminou com a aba fechada", () => {
    const endsAt = Date.now() - 1_000;
    window.localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({
        phase: "foco",
        status: "rodando",
        durationSec: 60,
        remainingSec: 60,
        endsAt,
        completedFocus: 0,
        subjectId: null,
        focusStartedAt: new Date(endsAt - 60_000).toISOString(),
      }),
    );
    const onPhaseFinished = vi.fn();
    renderHook(() => usePomodoro(settings, { onPhaseFinished }));
    act(() => vi.advanceTimersByTime(300));
    expect(onPhaseFinished).toHaveBeenCalledTimes(1);
  });
});
