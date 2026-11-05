"use client";

import { useState } from "react";
import { Button, TextField } from "@/components/ui";
import { notificationsSupported, requestNotificationPermission } from "@/lib/alerts";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { PomodoroSettings } from "@/lib/types";
import styles from "./PomodoroSettingsForm.module.scss";

interface Props {
  settings: PomodoroSettings;
  onChange: (settings: Partial<PomodoroSettings>) => void;
}

type NumericKey = "focusMin" | "shortBreakMin" | "longBreakMin" | "cyclesBeforeLongBreak";

const NUMERIC_FIELDS: { key: NumericKey; label: string; min: number; max: number; suffix: string }[] = [
  { key: "focusMin", label: "Foco", min: 1, max: 180, suffix: "min" },
  { key: "shortBreakMin", label: "Pausa curta", min: 1, max: 60, suffix: "min" },
  { key: "longBreakMin", label: "Pausa longa", min: 1, max: 120, suffix: "min" },
  { key: "cyclesBeforeLongBreak", label: "Ciclos até a pausa longa", min: 1, max: 12, suffix: "ciclos" },
];

export function PomodoroSettingsForm({ settings, onChange }: Props) {
  const [notice, setNotice] = useState<string>();

  async function toggleNotifications(enabled: boolean) {
    if (!enabled) return onChange({ notificationsEnabled: false });
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      setNotice(undefined);
      onChange({ notificationsEnabled: true });
    } else {
      setNotice(
        permission === "unsupported"
          ? "Seu navegador não suporta notificações."
          : "Permissão negada. Libere as notificações nas configurações do navegador.",
      );
    }
  }

  return (
    <div className={styles.form}>
      <div className={styles.grid}>
        {NUMERIC_FIELDS.map((field) => (
          <NumberSetting
            key={field.key}
            label={field.label}
            suffix={field.suffix}
            min={field.min}
            max={field.max}
            value={settings[field.key]}
            onCommit={(value) => onChange({ [field.key]: value })}
          />
        ))}
      </div>

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={settings.soundEnabled}
          onChange={(e) => onChange({ soundEnabled: e.target.checked })}
        />
        Tocar som ao terminar
      </label>

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={settings.notificationsEnabled}
          disabled={typeof window !== "undefined" && !notificationsSupported()}
          onChange={(e) => void toggleNotifications(e.target.checked)}
        />
        Mostrar notificação ao terminar
      </label>
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <Button
        variant="ghost"
        size="sm"
        className={styles.reset}
        onClick={() =>
          onChange({
            focusMin: DEFAULT_SETTINGS.focusMin,
            shortBreakMin: DEFAULT_SETTINGS.shortBreakMin,
            longBreakMin: DEFAULT_SETTINGS.longBreakMin,
            cyclesBeforeLongBreak: DEFAULT_SETTINGS.cyclesBeforeLongBreak,
          })
        }
      >
        Restaurar padrão (25/5/15)
      </Button>
    </div>
  );
}

interface NumberSettingProps {
  label: string;
  suffix: string;
  min: number;
  max: number;
  value: number;
  onCommit: (value: number) => void;
}

/** Campo numérico com rascunho local: permite apagar e digitar sem "pular" de valor. */
function NumberSetting({ label, suffix, min, max, value, onCommit }: NumberSettingProps) {
  const [draft, setDraft] = useState(String(value));
  const parsed = Number(draft);
  const valid = draft.trim() !== "" && Number.isInteger(parsed) && parsed >= min && parsed <= max;

  // Se o valor mudar por fora (ex.: "Restaurar padrão"), atualiza o rascunho.
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(String(value));
  }

  return (
    <TextField
      label={`${label} (${suffix})`}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={1}
      value={draft}
      error={valid ? undefined : `Entre ${min} e ${max}.`}
      onChange={(e) => {
        setDraft(e.target.value);
        const next = Number(e.target.value);
        if (e.target.value.trim() !== "" && Number.isInteger(next) && next >= min && next <= max) onCommit(next);
      }}
      onBlur={() => setDraft(String(value))}
    />
  );
}
