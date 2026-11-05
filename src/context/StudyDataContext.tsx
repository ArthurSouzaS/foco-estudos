"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { EMPTY_DATA, STORAGE_KEY } from "@/lib/constants";
import { dataReducer, type DataAction } from "@/lib/dataReducer";
import type {
  AppData,
  PomodoroSettings,
  StudySession,
  SubjectInput,
  TaskInput,
  TaskStatus,
} from "@/lib/types";
import { validateAppData } from "@/lib/validation";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export interface StudyDataContextValue {
  data: AppData;
  hydrated: boolean;
  dispatch: (action: DataAction) => void;
  addSubject: (input: SubjectInput) => void;
  updateSubject: (id: string, input: Partial<SubjectInput>) => void;
  deleteSubject: (id: string) => void;
  addTask: (input: TaskInput) => void;
  updateTask: (id: string, input: Partial<TaskInput>) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  addSession: (session: Omit<StudySession, "id">) => void;
  updateSettings: (settings: Partial<PomodoroSettings>) => void;
  replaceData: (data: AppData) => void;
  resetData: () => void;
}

const StudyDataContext = createContext<StudyDataContextValue | null>(null);

const validate = (value: unknown) => {
  const result = validateAppData(value);
  return result.ok ? result.data : null;
};

export function StudyDataProvider({ children }: { children: ReactNode }) {
  const [data, setData, { hydrated, remove }] = useLocalStorage<AppData>(STORAGE_KEY, EMPTY_DATA, {
    validate,
  });

  const dispatch = useCallback(
    (action: DataAction) => setData((prev) => dataReducer(prev, action)),
    [setData],
  );

  const value = useMemo<StudyDataContextValue>(
    () => ({
      data,
      hydrated,
      dispatch,
      addSubject: (payload) => dispatch({ type: "subject/add", payload }),
      updateSubject: (id, payload) => dispatch({ type: "subject/update", id, payload }),
      deleteSubject: (id) => dispatch({ type: "subject/delete", id }),
      addTask: (payload) => dispatch({ type: "task/add", payload }),
      updateTask: (id, payload) => dispatch({ type: "task/update", id, payload }),
      setTaskStatus: (id, status) => dispatch({ type: "task/setStatus", id, status }),
      deleteTask: (id) => dispatch({ type: "task/delete", id }),
      addSession: (payload) => dispatch({ type: "session/add", payload }),
      updateSettings: (payload) => dispatch({ type: "settings/update", payload }),
      replaceData: (payload) => dispatch({ type: "data/replace", payload }),
      resetData: remove,
    }),
    [data, hydrated, dispatch, remove],
  );

  return <StudyDataContext.Provider value={value}>{children}</StudyDataContext.Provider>;
}

export function useStudyData(): StudyDataContextValue {
  const ctx = useContext(StudyDataContext);
  if (!ctx) throw new Error("useStudyData precisa estar dentro de <StudyDataProvider>.");
  return ctx;
}
