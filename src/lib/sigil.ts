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
  const n = Math.max(letters.length, 1);
  const cx = 100;
  const cy = 100;
  const rot = ((seed % 40) / 40) * 0.4;

  function polar(r: number, a: number) {
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  }

  function ring(r: number, gold: boolean) {
    strokes.push({
      d: `M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 ${-r * 2} 0`,
      gold,
    });
  }

  function poly(r: number, sides: number, spin: number, gold: boolean) {
    const parts: string[] = [];
    for (let i = 0; i <= sides; i++) {
      const a = spin + (i / sides) * Math.PI * 2 - Math.PI / 2;
      const p = polar(r, a);
      parts.push(`${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    }
    parts.push("Z");
    strokes.push({ d: parts.join(" "), gold });
  }

  function star(rOuter: number, rInner: number, points: number, spin: number, gold: boolean) {
    const parts: string[] = [];
    const total = points * 2;
    for (let i = 0; i <= total; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const a = spin + (i / total) * Math.PI * 2 - Math.PI / 2;
      const p = polar(r, a);
      parts.push(`${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    }
    parts.push("Z");
    strokes.push({ d: parts.join(" "), gold });
  }

  ring(88, true);
  ring(78, true);
  ring(62, false);
  ring(36, true);
  ring(14, false);

  const ticks = 24;
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2 + rot;
    const major = i % 6 === 0;
    const inner = polar(major ? 70 : 74, a);
    const outer = polar(88, a);
    strokes.push({
      d: `M ${inner.x.toFixed(1)} ${inner.y.toFixed(1)} L ${outer.x.toFixed(1)} ${outer.y.toFixed(1)}`,
      gold: major,
    });
  }

  const starPoints = 5 + (seed % 3);
  star(54, 22, starPoints, rot, true);
  poly(46, 6, rot + 0.2, false);

  letters.forEach((ch, i) => {
    const glyph = GLYPHS[ch] ?? GLYPHS.X;
    const angle = (i / n) * Math.PI * 2 + rot;
    const scale = 28 + (seed % 6);
    const ox = cx + Math.cos(angle) * 10;
    const oy = cy + Math.sin(angle) * 10;
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

    const node = polar(78, angle);
    strokes.push({
      d: `M ${cx} ${cy} L ${node.x.toFixed(1)} ${node.y.toFixed(1)}`,
      gold: i % 2 === 1,
    });
    const next = polar(78, ((i + 1) / n) * Math.PI * 2 + rot);
    strokes.push({
      d: `M ${node.x.toFixed(1)} ${node.y.toFixed(1)} L ${next.x.toFixed(1)} ${next.y.toFixed(1)}`,
      gold: false,
    });
  });

  const spokes = 4 + (seed % 3);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2 + 0.35 + rot;
    const inner = polar(14, a);
    const outer = polar(88, a);
    strokes.push({
      d: `M ${inner.x.toFixed(1)} ${inner.y.toFixed(1)} L ${outer.x.toFixed(1)} ${outer.y.toFixed(1)}`,
      gold: i % 2 === 0,
    });
  }

  const cardinals = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  for (const a of cardinals) {
    const p = polar(88, a + rot);
    strokes.push({
      d: `M ${p.x.toFixed(1)} ${(p.y - 4).toFixed(1)} L ${(p.x + 3.2).toFixed(1)} ${(p.y + 2.2).toFixed(1)} L ${(p.x - 3.2).toFixed(1)} ${(p.y + 2.2).toFixed(1)} Z`,
      gold: true,
    });
  }

  strokes.push({
    d: `M ${cx} ${cy} m -5 0 a 5 5 0 1 1 10 0 a 5 5 0 1 1 -10 0`,
    gold: true,
  });

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
