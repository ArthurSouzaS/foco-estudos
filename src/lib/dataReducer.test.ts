import { describe, expect, it } from "vitest";
import { appData, session, subject, task } from "@/test/factories";
import { dataReducer } from "./dataReducer";

describe("dataReducer — matérias", () => {
  it("adiciona uma matéria com nome limpo", () => {
    const state = dataReducer(appData(), {
      type: "subject/add",
      payload: { name: "  Lógica   de Programação ", color: "#38bdf8" },
      id: "m1",
      now: "2026-11-05T10:00:00.000Z",
    });
    expect(state.subjects).toEqual([
      { id: "m1", name: "Lógica de Programação", color: "#38bdf8", createdAt: "2026-11-05T10:00:00.000Z" },
    ]);
  });

  it("ignora matéria sem nome", () => {
    const initial = appData();
    expect(dataReducer(initial, { type: "subject/add", payload: { name: "   ", color: "#fff000" } })).toBe(initial);
  });

  it("edita nome e cor", () => {
    const state = dataReducer(appData({ subjects: [subject()] }), {
      type: "subject/update",
      id: "mat-1",
      payload: { name: "BD II", color: "#a78bfa" },
    });
    expect(state.subjects[0]).toMatchObject({ name: "BD II", color: "#a78bfa" });
  });

  it("não aceita renomear para vazio", () => {
    const initial = appData({ subjects: [subject()] });
    expect(dataReducer(initial, { type: "subject/update", id: "mat-1", payload: { name: "" } })).toBe(initial);
  });

  it("exclui a matéria, suas tarefas e desvincula as sessões", () => {
    const initial = appData({
      subjects: [subject(), subject({ id: "mat-2", name: "Redes" })],
      tasks: [task(), task({ id: "tar-2", subjectId: "mat-2" })],
      sessions: [session([2026, 11, 5], 25, "mat-1"), session([2026, 11, 5], 25, "mat-2")],
    });
    const state = dataReducer(initial, { type: "subject/delete", id: "mat-1" });
    expect(state.subjects.map((s) => s.id)).toEqual(["mat-2"]);
    expect(state.tasks.map((t) => t.id)).toEqual(["tar-2"]);
    expect(state.sessions.map((s) => s.subjectId)).toEqual([null, "mat-2"]);
  });
});

describe("dataReducer — tarefas", () => {
  const base = appData({ subjects: [subject()] });

  it("cria tarefa com status padrão 'a-fazer'", () => {
    const state = dataReducer(base, {
      type: "task/add",
      payload: { subjectId: "mat-1", title: "Estudar JOINs", dueDate: "2026-11-10", priority: "alta" },
      id: "t1",
      now: "2026-11-05T10:00:00.000Z",
    });
    expect(state.tasks[0]).toEqual({
      id: "t1",
      subjectId: "mat-1",
      title: "Estudar JOINs",
      dueDate: "2026-11-10",
      priority: "alta",
      status: "a-fazer",
      createdAt: "2026-11-05T10:00:00.000Z",
    });
  });

  it("não cria tarefa para matéria inexistente ou sem título", () => {
    expect(
      dataReducer(base, { type: "task/add", payload: { subjectId: "x", title: "A", dueDate: null, priority: "baixa" } }),
    ).toBe(base);
    expect(
      dataReducer(base, { type: "task/add", payload: { subjectId: "mat-1", title: " ", dueDate: null, priority: "baixa" } }),
    ).toBe(base);
  });

  it("edita, muda status e remove prazo", () => {
    let state = appData({ subjects: [subject()], tasks: [task({ dueDate: "2026-11-10" })] });
    state = dataReducer(state, { type: "task/update", id: "tar-1", payload: { title: "Lista 2", dueDate: null } });
    state = dataReducer(state, { type: "task/setStatus", id: "tar-1", status: "fazendo" });
    expect(state.tasks[0]).toMatchObject({ title: "Lista 2", dueDate: null, status: "fazendo" });
  });

  it("exclui tarefa", () => {
    const state = dataReducer(appData({ subjects: [subject()], tasks: [task()] }), { type: "task/delete", id: "tar-1" });
    expect(state.tasks).toHaveLength(0);
  });
});

describe("dataReducer — sessões e configurações", () => {
  it("registra sessões com duração positiva", () => {
    const payload = { subjectId: "mat-1", startedAt: "2026-11-05T10:00:00.000Z", durationSec: 1500 };
    const state = dataReducer(appData(), { type: "session/add", payload, id: "s1" });
    expect(state.sessions).toEqual([{ id: "s1", ...payload }]);
    expect(dataReducer(appData(), { type: "session/add", payload: { ...payload, durationSec: 0 } }).sessions).toEqual([]);
  });

  it("atualiza parcialmente as configurações", () => {
    const state = dataReducer(appData(), { type: "settings/update", payload: { focusMin: 50 } });
    expect(state.settings.focusMin).toBe(50);
    expect(state.settings.shortBreakMin).toBe(5);
  });
});
