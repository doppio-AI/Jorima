"use client";

import { useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_THEME = "jorima_theme";
const STORAGE_FONT_SCALE = "jorima_font_scale";

export default function ThemeFontControls() {
  const [theme, setTheme] = useState<Theme>("light");
  const [fontScale, setFontScale] = useState<number>(1);

  const panelStyle = useMemo(
    () => ({
      position: "fixed" as const,
      right: 16,
      bottom: 16,
      zIndex: 50,
      width: 260,
      padding: 14,
      borderRadius: 14,
      border: "1px solid var(--neutral-300)",
      background: "var(--neutral-50)",
      boxShadow: "var(--shadow-md)",
      color: "var(--neutral-900)",
      display: "flex",
      flexDirection: "column" as const,
      gap: 10,
    }),
    []
  );

  useEffect(() => {
    void (async () => {
      try {
        const storedTheme =
          (localStorage.getItem(STORAGE_THEME) as Theme | null) ?? null;
        const storedScale = localStorage.getItem(STORAGE_FONT_SCALE);

        const nextTheme: Theme =
          storedTheme === "dark" || storedTheme === "light"
            ? storedTheme
            : "light";

        const nextScale = storedScale ? Number(storedScale) : 1;
        const safeScale = Number.isFinite(nextScale)
          ? clamp(nextScale, 0.85, 1.25)
          : 1;

        setTheme(nextTheme);
        setFontScale(safeScale);

        document.documentElement.dataset.theme = nextTheme;
        document.documentElement.style.setProperty(
          "--font-scale",
          String(safeScale)
        );
      } catch {
      }
    })();
  }, []);

  const applyThemeAndScale = (nextTheme: Theme, nextScale: number) => {
    setTheme(nextTheme);
    setFontScale(nextScale);
    try {
      localStorage.setItem(STORAGE_THEME, nextTheme);
      localStorage.setItem(STORAGE_FONT_SCALE, String(nextScale));
    } catch {
    }

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.setProperty("--font-scale", String(nextScale));
  };

  return (
    <div style={panelStyle} aria-label="Controles de accesibilidad">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <strong style={{ fontSize: 13 }}>Accesibilidad</strong>
        <span style={{ color: "var(--neutral-500)", fontSize: 12 }}>
          {theme === "dark" ? "Oscuro" : "Claro"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => applyThemeAndScale("light", fontScale)}
          style={button(theme === "light", theme)}
        >
          Claro
        </button>
        <button
          type="button"
          onClick={() => applyThemeAndScale("dark", fontScale)}
          style={button(theme === "dark", theme)}
        >
          Oscuro
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span style={{ color: "var(--neutral-500)", fontSize: 12 }}>Tamaño</span>
          <span style={{ color: "var(--neutral-900)", fontSize: 12 }}>
            {(fontScale * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min={0.85}
          max={1.25}
          step={0.05}
          value={fontScale}
          onChange={(e) => applyThemeAndScale(theme, Number(e.target.value))}
          aria-label="Control de tamaño de letra"
        />
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function button(active: boolean, _theme: Theme) {
  return {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 12,
    border: active ? `1px solid var(--color-verde-turquesa)` : "1px solid var(--neutral-300)",
    background: active ? "rgba(42,157,143,0.12)" : "transparent",
    color: "var(--neutral-900)",
    cursor: "pointer",
    fontWeight: 600,
  } as const;
}
