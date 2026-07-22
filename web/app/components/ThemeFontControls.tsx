"use client";

import { useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_THEME = "jorima_theme";
const STORAGE_FONT_SCALE = "jorima_font_scale";
const STORAGE_COLLAPSED = "jorima_controls_collapsed";

export default function ThemeFontControls() {
  // 1. AÑADIMOS EL ESTADO MOUNTED
  const [mounted, setMounted] = useState(false);

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const storedTheme = localStorage.getItem(STORAGE_THEME) as Theme | null;
    return storedTheme === "dark" ? "dark" : "light";
  });

  const [fontScale, setFontScale] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const storedScale = Number(localStorage.getItem(STORAGE_FONT_SCALE) ?? 1);
    return clamp(storedScale, 0.85, 1.25);
  });

  // Estado de minimizado, persistido igual que theme/fontScale
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_COLLAPSED) === "1";
  });

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

  // Botón flotante cuando el panel está minimizado
  const collapsedButtonStyle = useMemo(
    () => ({
      position: "fixed" as const,
      right: 16,
      bottom: 16,
      zIndex: 999,
      width: 44,
      height: 44,
      borderRadius: "50%",
      border: "1px solid var(--neutral-300)",
      background: "var(--neutral-50)",
      boxShadow: "var(--shadow-md)",
      color: "var(--neutral-900)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: 18,
    }),
    []
  );

  // 2. INDICAMOS QUE EL COMPONENTE YA SE MONTÓ EN EL CLIENTE
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.setProperty(
        "--font-scale",
        String(fontScale)
      );
    } catch {}
  }, [theme, fontScale]);

  const applyThemeAndScale = (nextTheme: Theme, nextScale: number) => {
    setTheme(nextTheme);
    setFontScale(nextScale);

    localStorage.setItem(STORAGE_THEME, nextTheme);
    localStorage.setItem(STORAGE_FONT_SCALE, String(nextScale));

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.setProperty("--font-scale", String(nextScale));
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_COLLAPSED, next ? "1" : "0");
      return next;
    });
  };

  // 3. SI AÚN NO SE HA MONTADO (ESTÁ EN EL SERVIDOR), NO RENDERIZAMOS NADA
  if (!mounted) {
    return null;
  }

  // 4. SI ESTÁ MINIMIZADO, SOLO MOSTRAMOS EL BOTÓN PARA EXPANDIR
  if (collapsed) {
    return (
      <button
        onClick={toggleCollapsed}
        style={collapsedButtonStyle}
        aria-label="Mostrar controles de accesibilidad"
        title="Mostrar controles de accesibilidad"
      >
        ⚙️
      </button>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 13 }}>Accesibilidad</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--neutral-500)" }}>
            {theme === "dark" ? "Oscuro" : "Claro"}
          </span>
          <button
            onClick={toggleCollapsed}
            aria-label="Minimizar controles"
            title="Minimizar"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: 4,
              color: "var(--neutral-500)",
            }}
          >
            ─
          </button>
        </div>
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
