/** Chaos-magick reducer: strip vowels and duplicate consonants, keep order. */
export function reduceIntent(raw: string): string {
  const letters = raw
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/[AEIOU]/g, "");
  const seen = new Set<string>();
  let out = "";
  for (const ch of letters) {
    if (seen.has(ch)) continue;
    seen.add(ch);
    out += ch;
  }
  return out;
}

/** Line segments in a 0–1 box. Compact gothic stroke alphabet. */
const GLYPHS: Record<string, number[][]> = {
  B: [
    [0.22, 0.08, 0.22, 0.92],
    [0.22, 0.08, 0.72, 0.08],
    [0.72, 0.08, 0.78, 0.28],
    [0.78, 0.28, 0.22, 0.48],
    [0.22, 0.48, 0.78, 0.62],
    [0.78, 0.62, 0.72, 0.92],
    [0.72, 0.92, 0.22, 0.92],
  ],
  C: [
    [0.78, 0.18, 0.42, 0.08],
    [0.42, 0.08, 0.2, 0.32],
    [0.2, 0.32, 0.2, 0.68],
    [0.2, 0.68, 0.42, 0.92],
    [0.42, 0.92, 0.78, 0.82],
  ],
  D: [
    [0.22, 0.08, 0.22, 0.92],
    [0.22, 0.08, 0.68, 0.18],
    [0.68, 0.18, 0.8, 0.5],
    [0.8, 0.5, 0.68, 0.82],
    [0.68, 0.82, 0.22, 0.92],
  ],
  F: [
    [0.24, 0.08, 0.24, 0.92],
    [0.24, 0.08, 0.8, 0.08],
    [0.24, 0.48, 0.68, 0.48],
  ],
  G: [
    [0.78, 0.2, 0.5, 0.08],
    [0.5, 0.08, 0.22, 0.32],
    [0.22, 0.32, 0.22, 0.7],
    [0.22, 0.7, 0.5, 0.92],
    [0.5, 0.92, 0.8, 0.72],
    [0.8, 0.72, 0.8, 0.52],
    [0.8, 0.52, 0.52, 0.52],
  ],
  H: [
    [0.22, 0.08, 0.22, 0.92],
    [0.78, 0.08, 0.78, 0.92],
    [0.22, 0.5, 0.78, 0.5],
  ],
  J: [
    [0.28, 0.08, 0.78, 0.08],
    [0.62, 0.08, 0.62, 0.72],
    [0.62, 0.72, 0.4, 0.92],
    [0.4, 0.92, 0.2, 0.78],
  ],
  K: [
    [0.24, 0.08, 0.24, 0.92],
    [0.78, 0.08, 0.24, 0.52],
    [0.4, 0.42, 0.8, 0.92],
  ],
  L: [
    [0.26, 0.08, 0.26, 0.92],
    [0.26, 0.92, 0.8, 0.92],
  ],
  M: [
    [0.12, 0.92, 0.12, 0.08],
    [0.12, 0.08, 0.5, 0.52],
    [0.5, 0.52, 0.88, 0.08],
    [0.88, 0.08, 0.88, 0.92],
  ],
  N: [
    [0.2, 0.92, 0.2, 0.08],
    [0.2, 0.08, 0.8, 0.92],
    [0.8, 0.92, 0.8, 0.08],
  ],
  P: [
    [0.24, 0.92, 0.24, 0.08],
    [0.24, 0.08, 0.72, 0.08],
    [0.72, 0.08, 0.8, 0.28],
    [0.8, 0.28, 0.68, 0.48],
    [0.68, 0.48, 0.24, 0.48],
  ],
  Q: [
    [0.5, 0.08, 0.22, 0.28],
    [0.22, 0.28, 0.22, 0.72],
    [0.22, 0.72, 0.5, 0.92],
    [0.5, 0.92, 0.78, 0.72],
    [0.78, 0.72, 0.78, 0.28],
    [0.78, 0.28, 0.5, 0.08],
    [0.58, 0.68, 0.84, 0.94],
  ],
  R: [
    [0.24, 0.92, 0.24, 0.08],
    [0.24, 0.08, 0.7, 0.08],
    [0.7, 0.08, 0.8, 0.28],
    [0.8, 0.28, 0.66, 0.48],
    [0.66, 0.48, 0.24, 0.48],
    [0.5, 0.48, 0.8, 0.92],
  ],
  S: [
    [0.78, 0.18, 0.5, 0.08],
    [0.5, 0.08, 0.22, 0.22],
    [0.22, 0.22, 0.28, 0.42],
    [0.28, 0.42, 0.72, 0.58],
    [0.72, 0.58, 0.78, 0.78],
    [0.78, 0.78, 0.5, 0.92],
    [0.5, 0.92, 0.2, 0.8],
  ],
  T: [
    [0.12, 0.08, 0.88, 0.08],
    [0.5, 0.08, 0.5, 0.92],
  ],
  V: [
    [0.12, 0.08, 0.5, 0.92],
    [0.5, 0.92, 0.88, 0.08],
  ],
  W: [
    [0.08, 0.08, 0.28, 0.92],
    [0.28, 0.92, 0.5, 0.36],
    [0.5, 0.36, 0.72, 0.92],
    [0.72, 0.92, 0.92, 0.08],
  ],
  X: [
    [0.18, 0.08, 0.82, 0.92],
    [0.82, 0.08, 0.18, 0.92],
  ],
  Y: [
    [0.16, 0.08, 0.5, 0.48],
    [0.84, 0.08, 0.5, 0.48],
    [0.5, 0.48, 0.5, 0.92],
  ],
  Z: [
    [0.18, 0.08, 0.82, 0.08],
    [0.82, 0.08, 0.18, 0.92],
    [0.18, 0.92, 0.82, 0.92],
  ],
};

function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type SigilStroke = {
  d: string;
  gold: boolean;
};

export function buildSigil(reduced: string): SigilStroke[] {
  const letters = (reduced || "I").split("");
  const seed = hashSeed(reduced || "IAM");
  const strokes: SigilStroke[] = [];
  const n = letters.length;
  const cx = 100;
  const cy = 100;

  strokes.push({
    d: `M ${cx} ${cy} m -78 0 a 78 78 0 1 1 156 0 a 78 78 0 1 1 -156 0`,
    gold: true,
  });
  strokes.push({
    d: `M ${cx} ${cy} m -54 0 a 54 54 0 1 1 108 0 a 54 54 0 1 1 -108 0`,
    gold: false,
  });

  letters.forEach((ch, i) => {
    const glyph = GLYPHS[ch] ?? GLYPHS.X;
    const angle = (i / Math.max(n, 1)) * Math.PI * 2 + ((seed % 40) / 40) * 0.4;
    const scale = 36 + (seed % 7);
    const ox = cx + Math.cos(angle) * 8;
    const oy = cy + Math.sin(angle) * 8;
    const parts: string[] = [];
    for (const [x1, y1, x2, y2] of glyph) {
      const rx1 = (x1 - 0.5) * scale;
      const ry1 = (y1 - 0.5) * scale;
      const rx2 = (x2 - 0.5) * scale;
      const ry2 = (y2 - 0.5) * scale;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const ax = ox + rx1 * c - ry1 * s;
      const ay = oy + rx1 * s + ry1 * c;
      const bx = ox + rx2 * c - ry2 * s;
      const by = oy + rx2 * s + ry2 * c;
      parts.push(`M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`);
    }
    strokes.push({ d: parts.join(" "), gold: i % 2 === 0 });
  });

  const spokes = 3 + (seed % 4);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2 + 0.2;
    const x2 = cx + Math.cos(a) * 78;
    const y2 = cy + Math.sin(a) * 78;
    strokes.push({
      d: `M ${cx} ${cy} L ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      gold: i % 2 === 1,
    });
  }

  return strokes;
}

export function proceduralCover(seed: string): string {
  const h = hashSeed(seed);
  const a = 20 + (h % 40);
  const b = 140 + ((h >> 5) % 40);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
    <rect width="400" height="600" fill="#0a0706"/>
    <rect x="18" y="18" width="364" height="564" fill="none" stroke="#d4af37" stroke-width="2"/>
    <rect x="28" y="28" width="344" height="544" fill="none" stroke="#e11d8f" stroke-width="0.6" opacity="0.7"/>
    <circle cx="200" cy="260" r="110" fill="none" stroke="#d4af37" stroke-width="1.2"/>
    <circle cx="200" cy="260" r="70" fill="none" stroke="#e11d8f" stroke-width="0.8"/>
    <path d="M200 80 L200 520" stroke="#d4af37" stroke-width="1"/>
    <path d="M60 ${a + 180} L340 ${b + 80}" stroke="#e11d8f" stroke-width="6" stroke-linecap="round" opacity="0.85"/>
    <path d="M90 40 L70 160 L78 280 L66 420 L80 560" fill="none" stroke="#e11d8f" stroke-width="5" opacity="0.55"/>
    <circle cx="200" cy="260" r="8" fill="#d4af37"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PLATES = ["/art/grimoire-plate.jpg", "/art/grimoire-plate-alt.jpg"] as const;

export function plateFor(seed: string): string {
  return PLATES[hashSeed(seed || "IAM") % PLATES.length];
}

export type LetterFate = "vowel" | "kept" | "dup" | "mark";

export function fateOfIntent(
  raw: string,
): { ch: string; fate: LetterFate }[] {
  const seen = new Set<string>();
  return [...raw].map((ch) => {
    if (/\s/.test(ch)) return { ch: " ", fate: "mark" as const };
    const up = ch.toUpperCase();
    if (!/[A-Z]/.test(up)) return { ch, fate: "mark" as const };
    if ("AEIOU".includes(up)) return { ch: up, fate: "vowel" as const };
    if (seen.has(up)) return { ch: up, fate: "dup" as const };
    seen.add(up);
    return { ch: up, fate: "kept" as const };
  });
}
