import { createId } from "./id";
import type {
  AppData,
  PomodoroSettings,
  StudySession,
  Subject,
  SubjectInput,
  Task,
  TaskInput,
  TaskStatus,
} from "./types";

export type DataAction =
  | { type: "subject/add"; payload: SubjectInput; id?: string; now?: string }
  | { type: "subject/update"; id: string; payload: Partial<SubjectInput> }
  | { type: "subject/delete"; id: string }
  | { type: "task/add"; payload: TaskInput; id?: string; now?: string }
  | { type: "task/update"; id: string; payload: Partial<TaskInput> }
  | { type: "task/setStatus"; id: string; status: TaskStatus }
  | { type: "task/delete"; id: string }
  | { type: "session/add"; payload: Omit<StudySession, "id">; id?: string }
  | { type: "settings/update"; payload: Partial<PomodoroSettings> }
  | { type: "data/replace"; payload: AppData };

const clean = (text: string) => text.trim().replace(/\s+/g, " ");

/**
 * Reducer puro com todas as operações de CRUD do app.
 * Entradas inválidas (ex.: nome vazio) são ignoradas e o estado é devolvido sem mudanças.
 */
export function dataReducer(state: AppData, action: DataAction): AppData {
  switch (action.type) {
    case "subject/add": {
      const name = clean(action.payload.name);
      if (!name) return state;
      const subject: Subject = {
        id: action.id ?? createId(),
        name,
        color: action.payload.color,
        createdAt: action.now ?? new Date().toISOString(),
      };
      return { ...state, subjects: [...state.subjects, subject] };
    }

    case "subject/update": {
      const { name, color } = action.payload;
      if (name !== undefined && !clean(name)) return state;
      return {
        ...state,
        subjects: state.subjects.map((s) =>
          s.id === action.id
            ? { ...s, ...(name !== undefined && { name: clean(name) }), ...(color && { color }) }
            : s,
        ),
      };
    }

    case "subject/delete": {
      if (!state.subjects.some((s) => s.id === action.id)) return state;
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.id !== action.id),
        // As tarefas da matéria são removidas junto com ela...
        tasks: state.tasks.filter((t) => t.subjectId !== action.id),
        // ...mas o histórico de estudo é mantido, apenas desvinculado.
        sessions: state.sessions.map((s) =>
          s.subjectId === action.id ? { ...s, subjectId: null } : s,
        ),
      };
    }

    case "task/add": {
      const title = clean(action.payload.title);
      if (!title || !state.subjects.some((s) => s.id === action.payload.subjectId)) return state;
      const task: Task = {
        id: action.id ?? createId(),
        subjectId: action.payload.subjectId,
        title,
        dueDate: action.payload.dueDate || null,
        priority: action.payload.priority,
        status: action.payload.status ?? "a-fazer",
        createdAt: action.now ?? new Date().toISOString(),
      };
      return { ...state, tasks: [...state.tasks, task] };
    }

    case "task/update": {
      const { title, subjectId } = action.payload;
      if (title !== undefined && !clean(title)) return state;
      if (subjectId !== undefined && !state.subjects.some((s) => s.id === subjectId)) return state;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? {
                ...t,
                ...action.payload,
                ...(title !== undefined && { title: clean(title) }),
                ...("dueDate" in action.payload && { dueDate: action.payload.dueDate || null }),
              }
            : t,
        ),
      };
    }

    case "task/setStatus":
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, status: action.status } : t)),
      };

    case "task/delete":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };

    case "session/add": {
      if (action.payload.durationSec <= 0) return state;
      return {
        ...state,
        sessions: [...state.sessions, { id: action.id ?? createId(), ...action.payload }],
      };
    }

    case "settings/update":
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case "data/replace":
      return action.payload;

    default:
      return state;
  }
}
