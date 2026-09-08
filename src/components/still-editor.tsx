import { useEffect, useRef, useState } from "react";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/input";
import {
  drawStill,
  EMPTY_STILL,
  loadStill,
  pressStill,
  STILL_FILTERS,
  STILL_RATIO,
  type StillAspect,
  type StillDraft,
  type StillRot,
} from "@/lib/still";
import { cn } from "@/lib/utils";

const ASPECTS: StillAspect[] = ["1:1", "4:5", "16:9", "3:1", "free"];

export function StillEditor({
  open,
  src,
  aspect,
  lockAspect,
  title = "Edit still",
  onOpenChange,
  onApply,
}: {
  open: boolean;
  src?: string;
  aspect?: StillAspect;
  lockAspect?: boolean;
  title?: string;
  onOpenChange: (open: boolean) => void;
  onApply: (jpeg: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [draft, setDraft] = useState<StillDraft>({
    ...EMPTY_STILL,
    aspect: aspect ?? "4:5",
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft({ ...EMPTY_STILL, aspect: aspect ?? "4:5" });
    setReady(false);
    imgRef.current = null;
    if (!src) return;
    let live = true;
    void loadStill(src)
      .then((img) => {
        if (!live) return;
        imgRef.current = img;
        setReady(true);
      })
      .catch(() => toast("That still would not load."));
    return () => {
      live = false;
    };
  }, [open, src, aspect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !ready) return;
    const ratio = STILL_RATIO[draft.aspect] ?? img.width / Math.max(1, img.height);
    const cssW = canvas.clientWidth || 360;
    const cssH = Math.max(160, Math.round(cssW / ratio));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0a0706";
    ctx.fillRect(0, 0, cssW, cssH);
    drawStill(ctx, img, draft, cssW, cssH);
  }, [draft, ready]);

  function paint(next: Partial<StillDraft>) {
    setDraft((d) => ({ ...d, ...next }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100%-1rem,40rem)] max-h-[92dvh] overflow-y-auto">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Crop, rotate, grade. Press writes a JPEG to the house.
        </DialogDescription>

        <div className="mt-4 overflow-hidden rounded-md bg-void foil-frame">
          <canvas
            ref={canvasRef}
            className="block w-full touch-none"
            onPointerDown={(e) => {
              (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
              drag.current = {
                x: e.clientX,
                y: e.clientY,
                panX: draft.panX,
                panY: draft.panY,
              };
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const canvas = canvasRef.current;
              if (!canvas) return;
              const dx = (e.clientX - drag.current.x) / canvas.clientWidth;
              const dy = (e.clientY - drag.current.y) / canvas.clientHeight;
              paint({
                panX: drag.current.panX + dx,
                panY: drag.current.panY + dy,
              });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
          />
        </div>

        {!lockAspect ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {ASPECTS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => paint({ aspect: id, panX: 0, panY: 0 })}
                className={cn(
                  "min-h-11 rounded-full px-3 text-xs uppercase tracking-[0.14em]",
                  draft.aspect === id
                    ? "bg-gold text-void"
                    : "text-ash shadow-[0_0_0_1px_var(--color-border)]",
                )}
              >
                {id}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {STILL_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => paint({ filter: f.id })}
              className={cn(
                "min-h-11 rounded-full px-3 text-xs uppercase tracking-[0.14em]",
                draft.filter === f.id
                  ? "bg-gold text-void"
                  : "text-ash shadow-[0_0_0_1px_var(--color-border)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="still-zoom">Zoom</Label>
            <input
              id="still-zoom"
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={draft.zoom}
              onChange={(e) => paint({ zoom: Number(e.target.value) })}
              className="w-full accent-gold"
            />
          </div>
          <div>
            <Label htmlFor="still-bright">Light</Label>
            <input
              id="still-bright"
              type="range"
              min={0.7}
              max={1.4}
              step={0.01}
              value={draft.brightness}
              onChange={(e) => paint({ brightness: Number(e.target.value) })}
              className="w-full accent-gold"
            />
          </div>
          <div>
            <Label htmlFor="still-contrast">Contrast</Label>
            <input
              id="still-contrast"
              type="range"
              min={0.7}
              max={1.5}
              step={0.01}
              value={draft.contrast}
              onChange={(e) => paint({ contrast: Number(e.target.value) })}
              className="w-full accent-gold"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                paint({
                  rot: ((draft.rot + 90) % 360) as StillRot,
                })
              }
            >
              <RotateCw className="size-3.5" />
              Rotate
            </Button>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!ready}
            onClick={() => {
              const img = imgRef.current;
              if (!img) return;
              try {
                onApply(pressStill(img, draft));
                onOpenChange(false);
              } catch {
                toast("Still would not press.");
              }
            }}
          >
            Press still
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
