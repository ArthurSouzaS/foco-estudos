"use client";

import { useState, type FormEvent } from "react";
import { Button, TextField } from "@/components/ui";
import { SUBJECT_COLORS } from "@/lib/constants";
import type { SubjectInput } from "@/lib/types";
import { ColorPicker } from "./ColorPicker";
import styles from "./SubjectForm.module.scss";

interface SubjectFormProps {
  initial?: SubjectInput;
  submitLabel?: string;
  /** Nomes já usados (em minúsculas) para evitar duplicidade. */
  existingNames?: string[];
  onSubmit: (input: SubjectInput) => void;
  onCancel?: () => void;
}

export function SubjectForm({
  initial,
  submitLabel = "Adicionar matéria",
  existingNames = [],
  onSubmit,
  onCancel,
}: SubjectFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState<string>(initial?.color ?? SUBJECT_COLORS[0]);
  const [error, setError] = useState<string>();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Informe o nome da matéria.");
    if (trimmed.length > 40) return setError("Use no máximo 40 caracteres.");
    if (existingNames.includes(trimmed.toLowerCase())) return setError("Já existe uma matéria com esse nome.");
    onSubmit({ name: trimmed, color });
    setError(undefined);
    if (!initial) {
      setName("");
      setColor(SUBJECT_COLORS[0]);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Nome da matéria"
        placeholder="Ex.: Banco de Dados"
        value={name}
        maxLength={40}
        error={error}
        onChange={(e) => {
          setName(e.target.value);
          if (error) setError(undefined);
        }}
      />
      <ColorPicker value={color} onChange={setColor} />
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
