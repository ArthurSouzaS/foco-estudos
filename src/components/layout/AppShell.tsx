"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { usePomodoroContext } from "@/context/PomodoroContext";
import { formatClock } from "@/lib/date";
import { PHASE_LABELS } from "@/lib/pomodoro";
import { LogoIcon } from "../icons";
import { NAV_ITEMS } from "./navItems";
import styles from "./AppShell.module.scss";

const normalize = (path: string) => (path.endsWith("/") ? path : `${path}/`);

function MiniTimer() {
  const { timer, remainingSec, hydrated } = usePomodoroContext();
  if (!hydrated || timer.status === "parado") return null;
  return (
    <Link
      href="/pomodoro/"
      className={styles.miniTimer}
      data-phase={timer.phase}
      aria-label={`Pomodoro ${timer.status === "rodando" ? "em andamento" : "pausado"}: ${formatClock(remainingSec)} restantes de ${PHASE_LABELS[timer.phase]}`}
    >
      <span className={styles.dot} data-paused={timer.status === "pausado"} aria-hidden="true" />
      <span className="mono">{formatClock(remainingSec)}</span>
      <span className={styles.miniLabel}>{PHASE_LABELS[timer.phase]}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = normalize(usePathname() ?? "/");

  return (
    <div className={styles.shell}>
      <a href="#conteudo" className={styles.skip}>
        Pular para o conteúdo
      </a>

      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <LogoIcon size={26} className={styles.logo} />
          <span>
            Foco <strong>Estudos</strong>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className={styles.nav}>
          <ul>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={styles.link}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <MiniTimer />

        <p className={styles.credits}>
          Feito por{" "}
          <a href="https://github.com/arthursouzas" target="_blank" rel="noreferrer">
            Arthur Souza Soares
          </a>
        </p>
      </aside>

      <main id="conteudo" className={styles.main} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
