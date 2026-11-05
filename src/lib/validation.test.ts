import { describe, expect, it } from "vitest";
import { appData, session, subject, task } from "@/test/factories";
import { DEFAULT_SETTINGS } from "./constants";
import { parseBackup, serializeBackup, validateAppData } from "./validation";

describe("exportar e importar JSON", () => {
  const data = appData({
    subjects: [subject()],
    tasks: [task({ dueDate: "2026-11-10" })],
    sessions: [session([2026, 11, 5], 25)],
  });

  it("ida e volta preserva os dados", () => {
    expect(parseBackup(serializeBackup(data))).toEqual({ ok: true, data });
  });

  it("rejeita JSON malformado", () => {
    expect(parseBackup("{ isso não é json")).toEqual({ ok: false, error: "O arquivo não é um JSON válido." });
  });

  it("rejeita versão desconhecida e itens inválidos", () => {
    expect(validateAppData({ ...data, version: 99 }).ok).toBe(false);
    const result = validateAppData({ ...data, tasks: [{ ...data.tasks[0], priority: "urgente" }] });
    expect(result).toEqual({ ok: false, error: 'Item 1 de "tasks" é inválido.' });
  });

  it("rejeita tarefa de matéria inexistente", () => {
    const result = validateAppData({ ...data, tasks: [task({ subjectId: "nao-existe" })] });
    expect(result.ok).toBe(false);
  });

  it("desvincula sessões de matérias inexistentes e corrige configurações inválidas", () => {
    const result = validateAppData({
      ...data,
      sessions: [session([2026, 11, 5], 25, "fantasma")],
      settings: { focusMin: -5, soundEnabled: false },
    });
    expect(result.ok && result.data.sessions[0]!.subjectId).toBeNull();
    expect(result.ok && result.data.settings).toEqual({ ...DEFAULT_SETTINGS, soundEnabled: false });
  });
});
