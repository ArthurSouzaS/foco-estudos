import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PomodoroProvider } from "@/context/PomodoroContext";
import { StudyDataProvider } from "@/context/StudyDataContext";
import "@/styles/globals.scss";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: { default: "Foco Estudos", template: "%s | Foco Estudos" },
  description:
    "Organize seus estudos: matérias, tarefas com prazo, timer Pomodoro e dashboard de progresso. Tudo salvo no seu navegador.",
  authors: [{ name: "Arthur Souza Soares", url: "https://github.com/arthursouzas" }],
  icons: { icon: `${basePath}/icon.svg` },
};

export const viewport: Viewport = {
  themeColor: "#0b0d12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <StudyDataProvider>
          <PomodoroProvider>
            <AppShell>{children}</AppShell>
          </PomodoroProvider>
        </StudyDataProvider>
      </body>
    </html>
  );
}
