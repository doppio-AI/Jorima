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
      zIndex: 999,
      width: 260,
      padding: 16,
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--neutral-300)",
      background: "var(--neutral-50)",
      boxShadow: "var(--shadow-md)",
      color: "var(--neutral-900)",
      display: "flex",
      flexDirection: "column" as const,
      gap: 12,
    }),
    []
  );

  useEffect(() => {
    try {
      const storedTheme =
        (localStorage.getItem(STORAGE_THEME) as Theme | null) ?? "light";

      const storedScale = Number(localStorage.getItem(STORAGE_FONT_SCALE) ?? 1);

      const safeScale = clamp(storedScale, 0.85, 1.25);

      setTheme(storedTheme);
      setFontScale(safeScale);

      document.documentElement.dataset.theme = storedTheme;
      document.documentElement.style.setProperty(
        "--font-scale",
        String(safeScale)
      );
    } catch {}
  }, []);

  const applyThemeAndScale = (nextTheme: Theme, nextScale: number) => {
    setTheme(nextTheme);
    setFontScale(nextScale);

    localStorage.setItem(STORAGE_THEME, nextTheme);
    localStorage.setItem(STORAGE_FONT_SCALE, String(nextScale));

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.setProperty("--font-scale", String(nextScale));
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 13 }}>Accesibilidad</strong>
        <span style={{ fontSize: 12, color: "var(--neutral-500)" }}>
          {theme === "dark" ? "Oscuro" : "Claro"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => applyThemeAndScale("light", fontScale)}
          style={btn(theme === "light")}
        >
          Claro
        </button>
        <button
          onClick={() => applyThemeAndScale("dark", fontScale)}
          style={btn(theme === "dark")}
        >
          Oscuro
        </button>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--neutral-500)" }}>
            Tamaño
          </span>
          <span style={{ fontSize: 12 }}>
            {(fontScale * 100).toFixed(0)}%
          </span>
        </div>

        <input
          type="range"
          min={0.85}
          max={1.25}
          step={0.05}
          value={fontScale}
          onChange={(e) =>
            applyThemeAndScale(theme, Number(e.target.value))
          }
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function btn(active: boolean) {
  return {
    flex: 1,
    padding: "8px",
    borderRadius: "var(--radius-lg)",
    border: active
      ? "1px solid var(--color-verde-turquesa)"
      : "1px solid var(--neutral-300)",
    background: active
      ? "rgba(42,157,143,0.15)"
      : "transparent",
    cursor: "pointer",
    fontWeight: 600,
    transition: "0.2s",
  } as const;
}