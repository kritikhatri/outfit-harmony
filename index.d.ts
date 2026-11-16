export type NeutralType =
  | 'black'
  | 'white'
  | 'grey'
  | 'cream'
  | 'navy'
  | 'denim'
  | 'camel'
  | 'brown';

export type Scheme =
  | 'neutral'
  | 'single-accent'
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'split-complementary'
  | 'triadic'
  | 'custom';

export type SuggestScheme =
  | 'auto'
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'monochromatic';

export interface Hsl {
  /** Hue in degrees, 0–359 */
  h: number;
  /** Saturation in percent, 0–100 */
  s: number;
  /** Lightness in percent, 0–100 */
  l: number;
}

export interface ColourEntry {
  hex: string;
  hsl: Hsl;
  /** Neutral category, 'custom' if passed via extraNeutrals, or null for accents */
  neutral: NeutralType | 'custom' | null;
}

export interface OutfitResult {
  score: number;
  verdict: 'works' | 'risky' | 'clashes';
  scheme: Scheme;
  colours: ColourEntry[];
  neutrals: string[];
  accents: string[];
  clashes: [string, string][];
  tips: string[];
}

export interface CheckOptions {
  /** Colours to treat as neutrals, e.g. olive or burgundy if those are staples for you */
  extraNeutrals?: string[];
}

export interface SuggestOptions {
  scheme?: SuggestScheme;
  /** 1–10, default 3 */
  count?: number;
  /** default true */
  includeNeutrals?: boolean;
}

export function checkOutfit(colours: string[], options?: CheckOptions): OutfitResult;
export function suggestMatches(colour: string, options?: SuggestOptions): string[];
export function detectScheme(hues: number[]): Scheme;

export function neutralType(hex: string): NeutralType | null;
export function isNeutral(hex: string): boolean;

export function normalizeHex(input: string): string;
export function hexToRgb(hex: string): { r: number; g: number; b: number };
export function hexToHsl(hex: string): Hsl;
export function hslToHex(hsl: Hsl): string;
export function hueDistance(a: number, b: number): number;

export const SCHEMES: readonly Scheme[];
export const SUGGEST_SCHEMES: readonly SuggestScheme[];
export const NEUTRAL_TYPES: readonly NeutralType[];
