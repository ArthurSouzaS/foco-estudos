"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BookIcon, CheckListIcon, FlameIcon, TimerIcon } from "@/components/icons";
import { Card, EmptyState, Loading, PageHeader } from "@/components/ui";
import { useStudyData } from "@/context/StudyDataContext";
import { formatDuration, toDateKey } from "@/lib/date";
import { calculateStreak, totalOnDay, totalsBySubject, upcomingTasks, weekTotals } from "@/lib/stats";
import { StatCard } from "./StatCard";
import { StreakCalendar } from "./StreakCalendar";
import { SubjectChart } from "./SubjectChart";
import { UpcomingTasks } from "./UpcomingTasks";
import { WeekChart } from "./WeekChart";
import styles from "./DashboardView.module.scss";

function greeting(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function DashboardView() {
  const { data, hydrated } = useStudyData();

  const stats = useMemo(() => {
    const today = new Date();
    const todayKey = toDateKey(today);
    const week = weekTotals(data.sessions, data.subjects, today);
    return {
      today,
      todayKey,
      week,
      weekTotal: week.reduce((sum, d) => sum + d.seconds, 0),
      todayTotal: totalOnDay(data.sessions, todayKey),
      bySubject: totalsBySubject(data.sessions, data.subjects),
      streak: calculateStreak(data.sessions, today),
      studiedDays: new Set(data.sessions.map((s) => toDateKey(new Date(s.startedAt)))),
      upcoming: upcomingTasks(data.tasks, today, 7),
      pending: data.tasks.filter((t) => t.status !== "feito").length,
      done: data.tasks.filter((t) => t.status === "feito").length,
    };
  }, [data]);

  if (!hydrated) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Loading />
      </>
    );
  }

  const { streak } = stats;

  return (
    <>
      <PageHeader
        title={`${greeting(stats.today.getHours())}! 👋`}
        description="Acompanhe seu ritmo de estudos e o que está para vencer."
      />

      {data.subjects.length === 0 && (
        <Card className={styles.onboarding}>
          <EmptyState
            icon="🚀"
            title="Bem-vindo ao Foco Estudos"
            description={
              <>
                Comece <Link href="/materias/">cadastrando suas matérias</Link>, depois crie{" "}
                <Link href="/tarefas/">tarefas</Link> e use o <Link href="/pomodoro/">Pomodoro</Link> para registrar o
                tempo estudado.
              </>
            }
          />
        </Card>
      )}

      <div className={styles.stats}>
        <StatCard
          label="Estudado hoje"
          value={formatDuration(stats.todayTotal)}
          tone="green"
          icon={<TimerIcon size={18} />}
        />
        <StatCard
          label="Nesta semana"
          value={formatDuration(stats.weekTotal)}
          detail={`Média de ${formatDuration(stats.weekTotal / 7)} por dia`}
          tone="blue"
          icon={<BookIcon size={18} />}
        />
        <StatCard
          label="Sequência"
          value={`${streak.current} ${streak.current === 1 ? "dia" : "dias"}`}
          detail={
            streak.current > 0 && !streak.studiedToday
              ? "Estude hoje para manter a sequência!"
              : `Recorde: ${streak.longest} ${streak.longest === 1 ? "dia" : "dias"}`
          }
          tone="warning"
          icon={<FlameIcon size={18} />}
        />
        <StatCard
          label="Tarefas pendentes"
          value={stats.pending}
          detail={`${stats.done} ${stats.done === 1 ? "concluída" : "concluídas"}`}
          tone="purple"
          icon={<CheckListIcon size={18} />}
        />
      </div>

      <div className={styles.grid}>
        <Card title="Tempo por dia da semana" className={styles.week}>
          <WeekChart days={stats.week} todayKey={stats.todayKey} />
        </Card>

        <Card title="Sequência de estudos" className={styles.streak}>
          <p className={styles.streakNumber}>
            <FlameIcon size={28} />
            <span className="mono">{streak.current}</span>
            <span className={styles.streakUnit}>{streak.current === 1 ? "dia seguido" : "dias seguidos"}</span>
          </p>
          <StreakCalendar studiedDays={stats.studiedDays} today={stats.today} />
          <p className={styles.streakHint}>Últimos 14 dias · recorde de {streak.longest} {streak.longest === 1 ? "dia" : "dias"}</p>
        </Card>

        <Card title="Tempo por matéria" className={styles.subjects}>
          {stats.bySubject.length === 0 ? (
            <EmptyState
              icon="📊"
              title="Sem sessões registradas"
              description={
                <>
                  Conclua um foco no <Link href="/pomodoro/">Pomodoro</Link> para ver seu progresso aqui.
                </>
              }
            />
          ) : (
            <SubjectChart totals={stats.bySubject} />
          )}
        </Card>

        <Card title="Próximos prazos" className={styles.upcoming}>
          <UpcomingTasks items={stats.upcoming} subjects={data.subjects} />
        </Card>
      </div>
    </>
  );
}
