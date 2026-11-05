import styles from "./Loading.module.scss";

export function Loading({ label = "Carregando seus dados…" }: { label?: string }) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      {label}
    </div>
  );
}
