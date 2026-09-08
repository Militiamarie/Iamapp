export const STILL_FILTERS = [
  { id: "raw", label: "Raw", css: "none" },
  { id: "gold", label: "Gold", css: "sepia(0.55) saturate(1.18) contrast(1.08)" },
  { id: "heat", label: "Heat", css: "hue-rotate(-18deg) saturate(1.48) contrast(1.1)" },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.28) brightness(0.96)" },
  { id: "wash", label: "Wash", css: "contrast(0.86) brightness(1.12) saturate(0.72)" },
  { id: "crush", label: "Crush", css: "contrast(1.4) saturate(0.62) brightness(0.92)" },
] as const;

export type StillFilterId = (typeof STILL_FILTERS)[number]["id"];
export type StillAspect = "free" | "1:1" | "4:5" | "16:9" | "3:1";
export type StillRot = 0 | 90 | 180 | 270;

export type StillDraft = {
  zoom: number;
  panX: number;
  panY: number;
  rot: StillRot;
  filter: StillFilterId;
  brightness: number;
  contrast: number;
  aspect: StillAspect;
};

export const EMPTY_STILL: StillDraft = {
  zoom: 1.05,
  panX: 0,
  panY: 0,
  rot: 0,
  filter: "raw",
  brightness: 1,
  contrast: 1,
  aspect: "4:5",
};

export const STILL_RATIO: Record<StillAspect, number | null> = {
  free: null,
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
  "3:1": 1600 / 560,
};

export function stillCss(d: Pick<StillDraft, "filter" | "brightness" | "contrast">) {
  const f = STILL_FILTERS.find((x) => x.id === d.filter)?.css ?? "none";
  const rest = `brightness(${d.brightness}) contrast(${d.contrast})`;
  return f === "none" ? rest : `${f} ${rest}`;
}

export function stillOutSize(aspect: StillAspect, imgW: number, imgH: number) {
  if (aspect === "1:1") return { w: 1080, h: 1080 };
  if (aspect === "4:5") return { w: 1080, h: 1350 };
  if (aspect === "16:9") return { w: 1400, h: 788 };
  if (aspect === "3:1") return { w: 1600, h: 560 };
  const r = imgW / Math.max(1, imgH);
  if (r >= 1) return { w: 1400, h: Math.max(1, Math.round(1400 / r)) };
  return { w: Math.max(1, Math.round(1400 * r)), h: 1400 };
}

export function loadStill(src: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const url = typeof src === "string" ? src : URL.createObjectURL(src);
    img.onload = () => {
      if (typeof src !== "string") URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      if (typeof src !== "string") URL.revokeObjectURL(url);
      reject(new Error("Still would not load."));
    };
    img.src = url;
  });
}

export function pressStill(
  img: CanvasImageSource & { width: number; height: number },
  draft: StillDraft,
) {
  const { w, h } = stillOutSize(draft.aspect, img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Still would not press.");
  ctx.fillStyle = "#0a0706";
  ctx.fillRect(0, 0, w, h);
  drawStill(ctx, img, draft, w, h);
  return canvas.toDataURL("image/jpeg", 0.84);
}

export function drawStill(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { width: number; height: number },
  draft: StillDraft,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.filter = stillCss(draft);
  ctx.translate(w / 2, h / 2);
  ctx.rotate((draft.rot * Math.PI) / 180);
  const swapped = draft.rot === 90 || draft.rot === 270;
  const iw = swapped ? img.height : img.width;
  const ih = swapped ? img.width : img.height;
  const cover = Math.max(w / Math.max(1, iw), h / Math.max(1, ih)) * draft.zoom;
  const dw = img.width * cover;
  const dh = img.height * cover;
  ctx.drawImage(img, -dw / 2 + draft.panX * w, -dh / 2 + draft.panY * h, dw, dh);
  ctx.restore();
}
