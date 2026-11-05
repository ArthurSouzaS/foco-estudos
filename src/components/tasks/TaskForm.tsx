"use client";

import { useState, type FormEvent } from "react";
import { Button, SelectField, TextField } from "@/components/ui";
import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import type { Subject, TaskInput, TaskPriority, TaskStatus } from "@/lib/types";
import styles from "./TaskForm.module.scss";

interface TaskFormProps {
  subjects: Subject[];
  initial?: TaskInput;
  defaultSubjectId?: string;
  submitLabel?: string;
  /** Exibe o seletor de status (útil na edição). */
  showStatus?: boolean;
  onSubmit: (input: TaskInput) => void;
  onCancel?: () => void;
}

export function TaskForm({
  subjects,
  initial,
  defaultSubjectId,
  submitLabel = "Adicionar tarefa",
  showStatus = false,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? defaultSubjectId ?? subjects[0]?.id ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? "media");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "a-fazer");
  const [error, setError] = useState<string>();

  const validSubject = subjects.some((s) => s.id === subjectId) ? subjectId : (subjects[0]?.id ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return setError("Descreva a tarefa.");
    onSubmit({
      title: title.trim(),
      subjectId: validSubject,
      dueDate: dueDate || null,
      priority,
      ...(showStatus && { status }),
    });
    setError(undefined);
    if (!initial) {
      setTitle("");
      setDueDate("");
      setPriority("media");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Tarefa"
        placeholder="Ex.: Resolver a lista de exercícios de SQL"
        value={title}
        maxLength={120}
        error={error}
        className={styles.title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (error) setError(undefined);
        }}
      />
      <SelectField label="Matéria" value={validSubject} onChange={(e) => setSubjectId(e.target.value)}>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </SelectField>
      <TextField label="Prazo" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      <SelectField label="Prioridade" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
        {TASK_PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
      </SelectField>
      {showStatus && (
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </SelectField>
      )}
      <div className={styles.actions}>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
