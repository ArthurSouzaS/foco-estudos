import { describe, expect, it } from "vitest";
import { task } from "@/test/factories";
import { DEFAULT_FILTERS, filterTasks, sortTasks } from "./tasks";

const tasks = [
  task({ id: "1", title: "Revisar normalização", subjectId: "bd", priority: "alta", status: "fazendo" }),
  task({ id: "2", title: "Exercícios de sub-rede", subjectId: "redes", priority: "baixa" }),
  task({ id: "3", title: "Prova de SQL", subjectId: "bd", priority: "media", status: "feito" }),
];

describe("filterTasks", () => {
  it("sem filtros devolve tudo", () => {
    expect(filterTasks(tasks, DEFAULT_FILTERS)).toHaveLength(3);
  });

  it("filtra por matéria, status e prioridade", () => {
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, subjectId: "bd" }).map((t) => t.id)).toEqual(["1", "3"]);
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, status: "a-fazer" }).map((t) => t.id)).toEqual(["2"]);
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, priority: "alta" }).map((t) => t.id)).toEqual(["1"]);
  });

  it("busca ignorando acentos e maiúsculas", () => {
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, search: "EXERCICIOS" }).map((t) => t.id)).toEqual(["2"]);
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, search: "normalizacao" }).map((t) => t.id)).toEqual(["1"]);
  });
});

describe("sortTasks", () => {
  it("coloca concluídas no fim, prazos próximos primeiro e sem prazo depois", () => {
    const list = [
      task({ id: "feita", status: "feito", dueDate: "2026-11-01" }),
      task({ id: "sem-prazo", dueDate: null }),
      task({ id: "dia-10", dueDate: "2026-11-10" }),
      task({ id: "dia-06-baixa", dueDate: "2026-11-06", priority: "baixa" }),
      task({ id: "dia-06-alta", dueDate: "2026-11-06", priority: "alta" }),
    ];
    expect(sortTasks(list).map((t) => t.id)).toEqual(["dia-06-alta", "dia-06-baixa", "dia-10", "sem-prazo", "feita"]);
  });
});
