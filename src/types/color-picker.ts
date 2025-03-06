export interface ColorConfig {
  primary: string;
  secondary: string;
  background: string;
}

export type ColorType = keyof ColorConfig; 