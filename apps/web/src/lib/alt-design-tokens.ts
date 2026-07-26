/**
 * ALT.xyz design tokens — audit reference for Beyoracle UI parity.
 *
 * Sources (Aug 2026):
 * - https://alt.xyz (inline splash/theme CSS, theme-color meta)
 * - https://use.typekit.net/ucg0rpr.css (Neue Haas Grotesk via Adobe Fonts)
 * - Emily Kolodny brand case study (named palette: Royal, Shadow, Slate, etc.)
 * - https://alt.xyz/blog/know-card-value-instantly (Alt Value + confidence UX)
 *
 * Keep `globals.css` `:root` values in sync with `altCssVars` below.
 */

/** Named brand palette from ALT identity system (Emily Kolodny / Holographik). */
export const altBrandColors = {
  altBlack: "#000000",
  shadow: "#1e2733",
  royal: "#7c50fc",
  gold: "#c9a227",
  tan: "#c4a882",
  felt: "#2d3748",
  seaweed: "#1a3a2f",
  navy: "#0f1729",
  levi: "#3d5a80",
  slate: "#64748b",
  powder: "#b8c5d6",
  soap: "#e8edf4",
  lavender: "#c4b5fd",
  aliceBlue: "#f0f8ff",
  snow: "#fafafa",
  success: "#34d399",
  warning: "#fbbf24",
  error: "#f87171",
} as const;

/**
 * Dark UI tokens mapped to Beyoracle `globals.css` custom properties.
 * Slightly lifted surfaces vs pure Alt Black for card depth on OLED displays.
 */
export const altDarkTheme = {
  bg: "#0a0a0f",
  surface: "#0f0f18",
  card: "#141420",
  cardHover: "#1a1a28",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.14)",
  text: "#f4f4f5",
  muted: "#71717a",
  mutedStrong: "#a1a1aa",
  accent: altBrandColors.royal,
  accentDim: "#5b3bd4",
  price: altBrandColors.success,
  priceDim: "#10b981",
  priceDown: altBrandColors.error,
  success: altBrandColors.success,
  warning: altBrandColors.warning,
} as const;

/** Light-theme body defaults from alt.xyz inline CSS (appTheme≠dark). */
export const altLightTheme = {
  bg: "#ffffff",
  text: altBrandColors.shadow,
} as const;

/** Typography — production stack observed on alt.xyz. */
export const altTypography = {
  fontDisplay:
    '"neue-haas-grotesk-display", "Neue Haas Grotesk Display", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontBody:
    '"neue-haas-grotesk-text", "Neue Haas Grotesk Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontRoboto: '"Roboto", "Helvetica Neue", Arial, sans-serif',
  fontSerif: '"Tiempos Fine", "Libre Caslon Text", Georgia, "Times New Roman", serif',
  fontSuisse: '"Suisse Intl", "Inter", system-ui, sans-serif',
  /** Beyoracle uses next/font Inter via --font-sans in layout.tsx */
  fontStack:
    'var(--font-sans), ui-sans-serif, system-ui, "Helvetica Neue", sans-serif',
  fontMono: 'ui-monospace, "SF Mono", "Cascadia Code", monospace',
} as const;

export const altFontSizes = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  priceHero: "2.5rem",
  priceHeroLg: "3rem",
} as const;

export const altFontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const altSpacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
} as const;

export const altRadii = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

export const altShadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
  md: "0 4px 12px rgba(0, 0, 0, 0.35)",
  lg: "0 8px 24px rgba(0, 0, 0, 0.4)",
} as const;

export const altLayout = {
  maxWidth: "1280px",
  headerHeight: "3.5rem",
  genNavHeight: "2.75rem",
  contentPadding: "1.5rem",
  cardGap: "1rem",
  gridMinCard: "280px",
} as const;

/** Chart + price hero patterns (Alt Value product UX). */
export const altChart = {
  type: "line" as const,
  strokeWidth: 2,
  strokeColor: altDarkTheme.accent,
  fillGradient: "rgba(124, 80, 252, 0.12)",
  gridColor: altDarkTheme.border,
  axisColor: altDarkTheme.muted,
  dotRadius: 3,
  ranges: ["1M", "3M", "6M", "1Y", "ALL"] as const,
  defaultRange: "6M" as const,
  heroPlacement: "above-chart" as const,
  confidenceLevels: ["low", "medium", "high"] as const,
} as const;

/** CSS custom property names — mirrors `globals.css` :root. */
export const altCssVarNames = {
  bg: "--bg",
  surface: "--surface",
  card: "--card",
  cardHover: "--card-hover",
  border: "--border",
  borderStrong: "--border-strong",
  text: "--text",
  muted: "--muted",
  mutedStrong: "--muted-strong",
  accent: "--accent",
  accentDim: "--accent-dim",
  price: "--price",
  priceDim: "--price-dim",
  priceDown: "--price-down",
  success: "--success",
  warning: "--warning",
  headerHeight: "--header-height",
  genNavHeight: "--gen-nav-height",
} as const;

/** Values keyed by CSS variable name (without `--` prefix in keys). */
export const altCssVars: Record<keyof typeof altCssVarNames, string> = {
  bg: altDarkTheme.bg,
  surface: altDarkTheme.surface,
  card: altDarkTheme.card,
  cardHover: altDarkTheme.cardHover,
  border: altDarkTheme.border,
  borderStrong: altDarkTheme.borderStrong,
  text: altDarkTheme.text,
  muted: altDarkTheme.muted,
  mutedStrong: altDarkTheme.mutedStrong,
  accent: altDarkTheme.accent,
  accentDim: altDarkTheme.accentDim,
  price: altDarkTheme.price,
  priceDim: altDarkTheme.priceDim,
  priceDown: altDarkTheme.priceDown,
  success: altDarkTheme.success,
  warning: altDarkTheme.warning,
  headerHeight: altLayout.headerHeight,
  genNavHeight: altLayout.genNavHeight,
};

/** Programmatic access — e.g. inline styles or Storybook swatches. */
export function altCssVar(name: keyof typeof altCssVarNames): string {
  return `var(${altCssVarNames[name]})`;
}

export type AltConfidence = (typeof altChart.confidenceLevels)[number];
export type AltChartRange = (typeof altChart.ranges)[number];
