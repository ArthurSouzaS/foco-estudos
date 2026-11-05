"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PauseIcon, PlayIcon, ResetIcon, SkipIcon } from "@/components/icons";
import { Button, Card, EmptyState, PageHeader, SelectField } from "@/components/ui";
import { usePomodoroContext } from "@/context/PomodoroContext";
import { useStudyData } from "@/context/StudyDataContext";
import { formatClock, formatDuration, toDateKey } from "@/lib/date";
import { PHASE_LABELS } from "@/lib/pomodoro";
import { NO_SUBJECT_LABEL } from "@/lib/stats";
import { PomodoroSettingsForm } from "./PomodoroSettingsForm";
import { TimerRing } from "./TimerRing";
import styles from "./PomodoroView.module.scss";

export function PomodoroView() {
  const { data, updateSettings } = useStudyData();
  const { timer, remainingSec, progress, hydrated, start, pause, reset, skip, setSubject } = usePomodoroContext();
  const running = timer.status === "rodando";
  const subject = data.subjects.find((s) => s.id === timer.subjectId);
  const cycles = data.settings.cyclesBeforeLongBreak;
  const cycleInRound = (timer.completedFocus % cycles) + (timer.phase === "foco" ? 1 : 0);

  const todaySessions = useMemo(() => {
    const today = toDateKey(new Date());
    return data.sessions
      .filter((s) => toDateKey(new Date(s.startedAt)) === today)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }, [data.sessions]);
  const todayTotal = todaySessions.reduce((sum, s) => sum + s.durationSec, 0);

  return (
    <>
      <PageHeader title="Pomodoro" description="Estude em blocos de foco com pausas. Cada foco concluído entra no seu dashboard." />

      <div className={styles.layout}>
        <Card className={styles.timerCard} aria-label="Timer">
          <div className={styles.phases} aria-hidden="true">
            {(["foco", "pausa-curta", "pausa-longa"] as const).map((p) => (
              <span key={p} className={styles.phase} data-active={timer.phase === p}>
                {PHASE_LABELS[p]}
              </span>
            ))}
          </div>

          <TimerRing progress={hydrated ? progress : 0} phase={timer.phase}>
            <span className={styles.clock} role="timer" aria-label={`${formatClock(remainingSec)} restantes`}>
              {hydrated ? formatClock(remainingSec) : "--:--"}
            </span>
            <span className={styles.phaseLabel}>{PHASE_LABELS[timer.phase]}</span>
            {timer.phase === "foco" && (
              <span className={styles.subjectLabel} style={{ color: subject?.color }}>
                {subject?.name ?? NO_SUBJECT_LABEL}
              </span>
            )}
          </TimerRing>

          {/* Anuncia mudanças de fase para leitores de tela, sem ler cada segundo. */}
          <p className="visually-hidden" aria-live="assertive">
            {timer.status === "parado" ? `${PHASE_LABELS[timer.phase]} pronto para iniciar` : ""}
          </p>

          <div className={styles.controls}>
            <Button variant="ghost" size="lg" iconOnly aria-label="Reiniciar fase" onClick={reset} disabled={!hydrated}>
              <ResetIcon />
            </Button>
            {running ? (
              <Button variant="primary" size="lg" className={styles.main} onClick={pause}>
                <PauseIcon /> Pausar
              </Button>
            ) : (
              <Button variant="primary" size="lg" className={styles.main} onClick={start} disabled={!hydrated}>
                <PlayIcon /> {timer.status === "pausado" ? "Continuar" : "Iniciar"}
              </Button>
            )}
            <Button variant="ghost" size="lg" iconOnly aria-label="Pular para a próxima fase" onClick={skip} disabled={!hydrated}>
              <SkipIcon />
            </Button>
          </div>

          <p className={styles.cycle}>
            Ciclo <span className="mono">{Math.min(cycleInRound, cycles)}</span> de <span className="mono">{cycles}</span>
            {" · "}
            <span className="mono">{timer.completedFocus}</span> {timer.completedFocus === 1 ? "foco concluído" : "focos concluídos"}
          </p>

          <div className={styles.subjectSelect}>
            {data.subjects.length === 0 ? (
              <p className={styles.hint}>
                <Link href="/materias/">Cadastre uma matéria</Link> para ligar o tempo estudado a ela.
              </p>
            ) : (
              <SelectField
                label="Matéria estudada"
                value={timer.subjectId ?? ""}
                disabled={timer.phase === "foco" && timer.status !== "parado"}
                hint={timer.phase === "foco" && timer.status !== "parado" ? "Reinicie ou conclua o foco para trocar." : undefined}
                onChange={(e) => setSubject(e.target.value || null)}
              >
                <option value="">{NO_SUBJECT_LABEL}</option>
                {data.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </SelectField>
            )}
          </div>
        </Card>

        <div className={styles.side}>
          <Card title="Configurações">
            <PomodoroSettingsForm settings={data.settings} onChange={updateSettings} />
          </Card>

          <Card title="Hoje" actions={<span className="mono">{formatDuration(todayTotal)}</span>}>
            {todaySessions.length === 0 ? (
              <EmptyState icon="⏱️" title="Nenhum foco hoje" description="Inicie o timer para registrar sua primeira sessão." />
            ) : (
              <ul className={styles.sessions}>
                {todaySessions.map((s) => {
                  const sub = data.subjects.find((x) => x.id === s.subjectId);
                  return (
                    <li key={s.id}>
                      <span className={styles.sessionDot} style={{ background: sub?.color ?? "var(--text-subtle)" }} aria-hidden="true" />
                      <span className={styles.sessionName}>{sub?.name ?? NO_SUBJECT_LABEL}</span>
                      <time className="mono" dateTime={s.startedAt}>
                        {new Date(s.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </time>
                      <span className="mono">{formatDuration(s.durationSec)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
