"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseLocalStorageOptions<T> {
  /**
   * Converte o valor lido (já com JSON.parse) para T.
   * Deve devolver null quando o valor for inválido; nesse caso o valor inicial é usado.
   */
  validate?: (value: unknown) => T | null;
}

export interface LocalStorageMeta {
  /** true depois que o valor salvo foi lido do navegador. */
  hydrated: boolean;
  /** Remove a chave e volta ao valor inicial. */
  remove: () => void;
}

type SetValue<T> = (value: T | ((previous: T) => T)) => void;

function resolveInitial<T>(initial: T | (() => T)): T {
  return typeof initial === "function" ? (initial as () => T)() : initial;
}

function readStorage<T>(key: string, validate?: (value: unknown) => T | null): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return validate ? validate(parsed) : (parsed as T);
  } catch {
    return null;
  }
}

/**
 * Estado React sincronizado com o localStorage.
 *
 * - Seguro para export estático/SSR: no servidor usa o valor inicial e lê o
 *   navegador apenas depois de montar (veja `hydrated`).
 * - Valida o conteúdo salvo para não quebrar o app com dados corrompidos.
 * - Sincroniza entre abas pelo evento `storage`.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseLocalStorageOptions<T> = {},
): [T, SetValue<T>, LocalStorageMeta] {
  const [value, setValue] = useState<T>(() => resolveInitial(initialValue));
  const [hydrated, setHydrated] = useState(false);
  const initialRef = useRef(initialValue);
  const validateRef = useRef(options.validate);
  /** Último JSON gravado/lido, para evitar escritas repetidas ou indevidas. */
  const lastRaw = useRef<string | null>(null);

  useEffect(() => {
    validateRef.current = options.validate;
  });

  // Leitura inicial (somente no navegador).
  useEffect(() => {
    const stored = readStorage(key, validateRef.current);
    if (stored !== null) {
      lastRaw.current = JSON.stringify(stored);
      setValue(stored);
    }
    setHydrated(true);
  }, [key]);

  // Escrita sempre que o valor muda, após a leitura inicial.
  useEffect(() => {
    if (!hydrated) return;
    const raw = JSON.stringify(value);
    if (raw === lastRaw.current) return;
    lastRaw.current = raw;
    try {
      window.localStorage.setItem(key, raw);
    } catch {
      // Cota cheia ou modo privado: o app continua funcionando só em memória.
    }
  }, [key, value, hydrated]);

  // Sincronização entre abas.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== key) return;
      const next = event.newValue === null ? null : readStorage(key, validateRef.current);
      const resolved = next ?? resolveInitial(initialRef.current);
      lastRaw.current = JSON.stringify(resolved);
      setValue(resolved);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignora */
    }
    const initial = resolveInitial(initialRef.current);
    lastRaw.current = JSON.stringify(initial);
    setValue(initial);
  }, [key]);

  return [value, setValue, { hydrated, remove }];
}
