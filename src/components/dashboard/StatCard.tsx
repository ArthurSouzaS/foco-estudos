import type { ReactNode } from "react";
import styles from "./StatCard.module.scss";

interface StatCardProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "green" | "blue" | "purple" | "warning";
  icon?: ReactNode;
}

export function StatCard({ label, value, detail, tone = "green", icon }: StatCardProps) {
  return (
    <div className={styles.card} data-tone={tone}>
      <div className={styles.top}>
        <p className={styles.label}>{label}</p>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className={styles.value}>{value}</p>
      {detail && <p className={styles.detail}>{detail}</p>}
    </div>
  );
}
