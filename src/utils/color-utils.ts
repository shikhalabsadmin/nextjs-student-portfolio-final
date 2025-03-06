import { ColorConfig, ColorType } from "@/types/color-picker";

// Utility function to convert HSL to Hex
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Function to convert Hex to HSL
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove the # if present
  hex = hex.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  // Convert to degrees and percentages
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Function to get CSS variable value and convert to hex
export function getCssVariableColor(variableName: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  
  if (!value) return "#000000";
  
  const [h, s, l] = value.split(" ").map(v => parseFloat(v.replace("%", "")));
  return hslToHex(h, s, l);
}

// Function to update CSS variable with HSL values
export function updateCssVariable(colorType: ColorType, hexColor: string) {
  const hsl = hexToHSL(hexColor);
  const value = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
  document.documentElement.style.setProperty(`--${colorType}`, value);
}

// Function to get initial colors from CSS
export function getInitialColors(): ColorConfig {
  return {
    primary: getCssVariableColor("--primary"),
    secondary: getCssVariableColor("--secondary"),
    background: getCssVariableColor("--background"),
  };
} 