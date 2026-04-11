// Tipografía consistente basada en la definición móvil
// Adaptada para uso en CSS con variables CSS

export const typography = {
  // Tamaños de fuente (rem)
  fontSize: {
    xs: 'var(--text-xs)',      // 12px
    sm: 'var(--text-sm)',      // 14px
    base: 'var(--text-base)',  // 16px
    lg: 'var(--text-lg)',      // 18px
    xl: 'var(--text-xl)',      // 20px
    '2xl': 'var(--text-2xl)',  // 24px
    '3xl': 'var(--text-3xl)',  // 30px
    '4xl': 'var(--text-4xl)',  // 36px
    '5xl': 'var(--text-5xl)',  // 48px
  },

  // Pesos de fuente
  fontWeight: {
    light: 'var(--font-light)',      // 400
    medium: 'var(--font-medium)',    // 500
    semibold: 'var(--font-semibold)', // 600
    bold: 'var(--font-bold)',        // 700
  },

  // Jerarquía tipográfica (equivalente a móvil)
  h1: {
    fontSize: 'var(--text-4xl)',     // 36px (móvil: 32px)
    fontWeight: 'var(--font-bold)',  // 700 (móvil: 700)
  },
  h2: {
    fontSize: 'var(--text-3xl)',     // 30px (móvil: 24px)
    fontWeight: 'var(--font-bold)',  // 700 (móvil: 700)
  },
  h3: {
    fontSize: 'var(--text-2xl)',         // 24px (móvil: 20px)
    fontWeight: 'var(--font-semibold)',  // 600 (móvil: 600)
  },
  body: {
    fontSize: 'var(--text-base)',    // 16px (móvil: 16px)
    fontWeight: 'var(--font-light)', // 400 (móvil: 400)
  },
  bodySmall: {
    fontSize: 'var(--text-sm)',      // 14px (móvil: 14px)
    fontWeight: 'var(--font-light)', // 400 (móvil: 400)
  },
  button: {
    fontSize: 'var(--text-base)',        // 16px (móvil: 16px)
    fontWeight: 'var(--font-semibold)',  // 600 (móvil: 600)
  },
  caption: {
    fontSize: 'var(--text-xs)',      // 12px (móvil: 12px)
    fontWeight: 'var(--font-light)', // 400 (móvil: 400)
  },
} as const;

export type Typography = typeof typography;