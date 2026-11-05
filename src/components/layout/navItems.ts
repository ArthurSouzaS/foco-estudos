import type { ComponentType, SVGProps } from "react";
import { BookIcon, CheckListIcon, DashboardIcon, DatabaseIcon, TimerIcon } from "../icons";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/materias/", label: "Matérias", icon: BookIcon },
  { href: "/tarefas/", label: "Tarefas", icon: CheckListIcon },
  { href: "/pomodoro/", label: "Pomodoro", icon: TimerIcon },
  { href: "/dados/", label: "Dados", icon: DatabaseIcon },
];
