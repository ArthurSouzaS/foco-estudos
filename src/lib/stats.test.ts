import { describe, expect, it } from "vitest";
import { session, subject, task } from "@/test/factories";
import {
  calculateStreak,
  describeDaysLeft,
  NO_SUBJECT_LABEL,
  totalOnDay,
  totalsBySubject,
  upcomingTasks,
  weekTotals,
} from "./stats";

const subjects = [subject(), subject({ id: "mat-2", name: "Redes", color: "#38bdf8" })];
// Quinta-feira, 5 de novembro de 2026.
const TODAY = new Date(2026, 10, 5, 15);

describe("totalsBySubject", () => {
  it("soma por matéria e ordena do maior para o menor", () => {
    const totals = totalsBySubject(
      [
        session([2026, 11, 5], 25, "mat-1"),
        session([2026, 11, 4], 50, "mat-2"),
        session([2026, 11, 3], 25, "mat-1"),
        session([2026, 11, 3], 10, null),
        session([2026, 11, 3], 5, "apagada"),
      ],
      subjects,
    );
    expect(totals.map((t) => [t.name, t.seconds / 60])).toEqual([
      ["Banco de Dados", 50],
      ["Redes", 50],
      [NO_SUBJECT_LABEL, 15],
    ]);
  });

  it("retorna lista vazia sem sessões", () => {
    expect(totalsBySubject([], subjects)).toEqual([]);
  });
});

describe("weekTotals", () => {
  it("monta a semana de segunda a domingo com segmentos por matéria", () => {
    const week = weekTotals(
      [
        session([2026, 11, 2], 25, "mat-1"), // segunda
        session([2026, 11, 5], 25, "mat-1"), // quinta
        session([2026, 11, 5], 30, "mat-2"),
        session([2026, 11, 5], 20, "mat-1"),
        session([2026, 11, 1], 60, "mat-1"), // domingo da semana anterior
        session([2026, 11, 9], 60, "mat-1"), // próxima segunda
      ],
      subjects,
      TODAY,
    );
    expect(week.map((d) => d.label)).toEqual(["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]);
    expect(week[0]!.date).toBe("2026-11-02");
    expect(week[6]!.date).toBe("2026-11-08");
    expect(week.map((d) => d.seconds / 60)).toEqual([25, 0, 0, 75, 0, 0, 0]);
    expect(week[3]!.segments).toEqual([
      { subjectId: "mat-1", color: "#34d399", seconds: 45 * 60 },
      { subjectId: "mat-2", color: "#38bdf8", seconds: 30 * 60 },
    ]);
  });

  it("trata domingo como último dia da semana", () => {
    const sunday = new Date(2026, 10, 8, 20);
    expect(weekTotals([], subjects, sunday)[0]!.date).toBe("2026-11-02");
  });
});

describe("totalOnDay", () => {
  it("soma apenas o dia informado", () => {
    const sessions = [session([2026, 11, 5], 25), session([2026, 11, 5, 22], 10), session([2026, 11, 4], 50)];
    expect(totalOnDay(sessions, "2026-11-05")).toBe(35 * 60);
  });
});

describe("calculateStreak", () => {
  it("conta dias seguidos até hoje", () => {
    const sessions = [3, 4, 5].map((d) => session([2026, 11, d], 25));
    expect(calculateStreak(sessions, TODAY)).toEqual({ current: 3, longest: 3, studiedToday: true });
  });

  it("mantém a sequência se estudou ontem mas ainda não hoje", () => {
    const sessions = [2, 3, 4].map((d) => session([2026, 11, d], 25));
    expect(calculateStreak(sessions, TODAY)).toMatchObject({ current: 3, studiedToday: false });
  });

  it("zera a sequência quando pulou um dia e guarda o recorde", () => {
    const sessions = [
      ...[20, 21, 22, 23].map((d) => session([2026, 10, d], 25)),
      session([2026, 11, 3], 25),
      session([2026, 11, 3, 18], 25), // dois estudos no mesmo dia contam uma vez
    ];
    expect(calculateStreak(sessions, TODAY)).toEqual({ current: 0, longest: 4, studiedToday: false });
  });

  it("atravessa a virada de mês", () => {
    const sessions = [session([2026, 10, 31], 25), session([2026, 11, 1], 25)];
    expect(calculateStreak(sessions, new Date(2026, 10, 1)).current).toBe(2);
  });

  it("sem sessões é zero", () => {
    expect(calculateStreak([], TODAY)).toEqual({ current: 0, longest: 0, studiedToday: false });
  });
});

describe("upcomingTasks", () => {
  const tasks = [
    task({ id: "atrasada", dueDate: "2026-11-03" }),
    task({ id: "hoje-baixa", dueDate: "2026-11-05", priority: "baixa" }),
    task({ id: "hoje-alta", dueDate: "2026-11-05", priority: "alta" }),
    task({ id: "semana", dueDate: "2026-11-12" }),
    task({ id: "longe", dueDate: "2026-11-13" }),
    task({ id: "sem-prazo", dueDate: null }),
    task({ id: "feita", dueDate: "2026-11-06", status: "feito" }),
  ];

  it("lista atrasadas e próximas 7 dias, por prazo e prioridade", () => {
    const result = upcomingTasks(tasks, TODAY, 7);
    expect(result.map((r) => [r.task.id, r.daysLeft])).toEqual([
      ["atrasada", -2],
      ["hoje-alta", 0],
      ["hoje-baixa", 0],
      ["semana", 7],
    ]);
  });
});

describe("describeDaysLeft", () => {
  it.each([
    [-3, "Atrasada há 3 dias"],
    [-1, "Atrasada há 1 dia"],
    [0, "Hoje"],
    [1, "Amanhã"],
    [4, "Em 4 dias"],
  ])("%i → %s", (days, text) => {
    expect(describeDaysLeft(days)).toBe(text);
  });
});
