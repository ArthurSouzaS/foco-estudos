import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLocalStorage } from "./useLocalStorage";

const KEY = "teste:chave";

describe("useLocalStorage", () => {
  it("usa o valor inicial quando não há nada salvo", () => {
    const { result } = renderHook(() => useLocalStorage(KEY, { contador: 0 }));
    expect(result.current[0]).toEqual({ contador: 0 });
    expect(result.current[2].hydrated).toBe(true);
  });

  it("lê o valor salvo e grava as alterações", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ contador: 5 }));
    const { result } = renderHook(() => useLocalStorage(KEY, { contador: 0 }));
    expect(result.current[0]).toEqual({ contador: 5 });

    act(() => result.current[1]((prev) => ({ contador: prev.contador + 1 })));
    expect(result.current[0]).toEqual({ contador: 6 });
    expect(JSON.parse(window.localStorage.getItem(KEY)!)).toEqual({ contador: 6 });
  });

  it("descarta conteúdo corrompido ou inválido", () => {
    window.localStorage.setItem(KEY, "{ quebrado");
    const { result } = renderHook(() => useLocalStorage(KEY, 1));
    expect(result.current[0]).toBe(1);

    window.localStorage.setItem("outra", JSON.stringify("texto"));
    const validated = renderHook(() =>
      useLocalStorage<number>("outra", 7, { validate: (v) => (typeof v === "number" ? v : null) }),
    );
    expect(validated.result.current[0]).toBe(7);
  });

  it("remove a chave e volta ao valor inicial", () => {
    const { result } = renderHook(() => useLocalStorage(KEY, "inicial"));
    act(() => result.current[1]("alterado"));
    expect(window.localStorage.getItem(KEY)).toBe('"alterado"');
    act(() => result.current[2].remove());
    expect(result.current[0]).toBe("inicial");
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("sincroniza com alterações feitas em outra aba", () => {
    const { result } = renderHook(() => useLocalStorage(KEY, 0));
    act(() => {
      window.localStorage.setItem(KEY, "42");
      window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: "42", storageArea: window.localStorage }));
    });
    expect(result.current[0]).toBe(42);
  });
});
