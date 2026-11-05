"use client";

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePomodoro, type PomodoroControls } from "@/hooks/usePomodoro";
import { playChime, showNotification, unlockAudio } from "@/lib/alerts";
import { formatClock, formatDuration } from "@/lib/date";
import { PHASE_LABELS, type FinishedPhase } from "@/lib/pomodoro";
import { useStudyData } from "./StudyDataContext";

const PomodoroContext = createContext<PomodoroControls | null>(null);

const APP_TITLE = "Foco Estudos";

/** Mantém o Pomodoro vivo em todas as páginas, registrando as sessões de foco concluídas. */
export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { data, addSession } = useStudyData();
  const { settings, subjects } = data;

  const onPhaseFinished = useCallback(
    (finished: FinishedPhase, natural: boolean) => {
      if (finished.phase === "foco" && finished.studiedSec > 0) {
        addSession({
          subjectId: finished.subjectId,
          startedAt: finished.startedAt,
          durationSec: finished.studiedSec,
        });
      }
      if (!natural) return;
      if (settings.soundEnabled) playChime();
      if (settings.notificationsEnabled) {
        const subject = subjects.find((s) => s.id === finished.subjectId)?.name;
        if (finished.phase === "foco") {
          showNotification(
            "Foco concluído! 🎉",
            `Você estudou ${formatDuration(finished.studiedSec)}${subject ? ` de ${subject}` : ""}. Hora de uma pausa.`,
          );
        } else {
          showNotification("Pausa encerrada", "Bora voltar para o foco?");
        }
      }
    },
    [addSession, settings.soundEnabled, settings.notificationsEnabled, subjects],
  );

  const controls = usePomodoro(settings, { onPhaseFinished });
  const { timer, remainingSec, start } = controls;

  // Se a matéria escolhida for excluída, desvincula o timer.
  const { setSubject } = controls;
  useEffect(() => {
    if (timer.subjectId && !subjects.some((s) => s.id === timer.subjectId)) setSubject(null);
  }, [subjects, timer.subjectId, setSubject]);

  // Mostra o tempo restante no título da aba enquanto o timer roda.
  const baseTitle = useRef<string | null>(null);
  useEffect(() => {
    if (timer.status === "rodando") {
      baseTitle.current ??= document.title || APP_TITLE;
      document.title = `${formatClock(remainingSec)} · ${PHASE_LABELS[timer.phase]} | ${APP_TITLE}`;
    } else if (baseTitle.current !== null) {
      document.title = baseTitle.current;
      baseTitle.current = null;
    }
  }, [timer.status, timer.phase, remainingSec]);

  const startWithAudio = useCallback(() => {
    unlockAudio();
    start();
  }, [start]);

  return (
    <PomodoroContext.Provider value={{ ...controls, start: startWithAudio }}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoroContext(): PomodoroControls {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoroContext precisa estar dentro de <PomodoroProvider>.");
  return ctx;
}
