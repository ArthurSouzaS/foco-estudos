import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import styles from "./Field.module.scss";

interface FieldWrapperProps {
  label: string;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
  className?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

function FieldWrapper({ label, hint, error, hideLabel, className, children }: FieldWrapperProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={hideLabel ? "visually-hidden" : styles.label}>
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type BaseProps = Pick<FieldWrapperProps, "label" | "hint" | "error" | "hideLabel" | "className">;

export function TextField({
  label,
  hint,
  error,
  hideLabel,
  className,
  ...inputProps
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrapper {...{ label, hint, error, hideLabel, className }}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          className={styles.control}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          {...inputProps}
        />
      )}
    </FieldWrapper>
  );
}

export function SelectField({
  label,
  hint,
  error,
  hideLabel,
  className,
  children,
  ...selectProps
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldWrapper {...{ label, hint, error, hideLabel, className }}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          className={`${styles.control} ${styles.select}`}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          {...selectProps}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  );
}
