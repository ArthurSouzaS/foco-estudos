"use client";

import { useId, type CSSProperties } from "react";
import { SUBJECT_COLORS } from "@/lib/constants";
import styles from "./ColorPicker.module.scss";

const COLOR_NAMES: Record<string, string> = {
  "#34d399": "Verde",
  "#38bdf8": "Azul",
  "#a78bfa": "Roxo",
  "#f472b6": "Rosa",
  "#fbbf24": "Amarelo",
  "#fb923c": "Laranja",
  "#f87171": "Vermelho",
  "#2dd4bf": "Turquesa",
};

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const name = useId();
  const isCustom = !SUBJECT_COLORS.includes(value as (typeof SUBJECT_COLORS)[number]);

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Cor</legend>
      <div className={styles.swatches}>
        {SUBJECT_COLORS.map((color) => (
          <label key={color} className={styles.swatch} style={{ "--swatch": color } as CSSProperties}>
            <input
              type="radio"
              name={name}
              value={color}
              checked={value === color}
              onChange={() => onChange(color)}
              className="visually-hidden"
            />
            <span className={styles.dot} aria-hidden="true" />
            <span className="visually-hidden">{COLOR_NAMES[color]}</span>
          </label>
        ))}
        <label className={styles.custom} data-active={isCustom}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Escolher outra cor"
          />
        </label>
      </div>
    </fieldset>
  );
}
