import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.scss";

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  /** Conteúdo exibido à direita do título (ex.: botões). */
  actions?: ReactNode;
  as?: "section" | "article" | "div";
}

export function Card({ title, actions, as: Tag = "section", className, children, ...props }: CardProps) {
  return (
    <Tag className={[styles.card, className].filter(Boolean).join(" ")} {...props}>
      {(title || actions) && (
        <header className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}
