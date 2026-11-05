import type { Metadata } from "next";
import { PomodoroView } from "@/components/pomodoro/PomodoroView";

export const metadata: Metadata = { title: "Pomodoro" };

export default function PomodoroPage() {
  return <PomodoroView />;
}
