export const DEFAULT_BRAND_COLOR = "#ff3f65";

type Hsl = { h: number; s: number; l: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizeHex(input: string): string | null {
  const v = input.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(v)) return null;
  return v;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const v = hex.slice(1);
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }: Hsl): { r: number; g: number; b: number } {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = ln - c / 2;
  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
}

function adjustLightness(hex: string, deltaL: number): string {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  const next: Hsl = { h: hsl.h, s: hsl.s, l: clamp(hsl.l + deltaL, 0, 100) };
  const rgb = hslToRgb(next);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

// 흰색/검은색 글자 중 어느 쪽이 대비가 좋은지 — WCAG relative luminance
function readableForeground(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const luminance =
    0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  return luminance > 0.5 ? "#1a0610" : "#ffffff";
}

export type BrandPalette = {
  brand: string;
  brandLight: string;
  brandDark: string;
  brandForeground: string;
};

export function buildBrandPalette(input: string | null | undefined): BrandPalette {
  const safe = (input && normalizeHex(input)) || DEFAULT_BRAND_COLOR;
  return {
    brand: safe,
    brandLight: adjustLightness(safe, +32),
    brandDark: adjustLightness(safe, -18),
    brandForeground: readableForeground(safe),
  };
}

// SSR: inline style 객체로 (authed) layout main에 박는다.
export function brandStyleVars(input: string | null | undefined): React.CSSProperties {
  const p = buildBrandPalette(input);
  return {
    ["--brand" as string]: p.brand,
    ["--brand-light" as string]: p.brandLight,
    ["--brand-dark" as string]: p.brandDark,
    ["--brand-foreground" as string]: p.brandForeground,
  };
}

// 클라이언트 사이드 동적 교체 (예: 최애 변경 즉시 반영)
export function applyArtistTheme(input: string | null | undefined): void {
  if (typeof document === "undefined") return;
  const p = buildBrandPalette(input);
  const root = document.documentElement.style;
  root.setProperty("--brand", p.brand);
  root.setProperty("--brand-light", p.brandLight);
  root.setProperty("--brand-dark", p.brandDark);
  root.setProperty("--brand-foreground", p.brandForeground);
}
