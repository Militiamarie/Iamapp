import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, ImagePlus, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { parseScan, type ScanHit } from "@/lib/rails";
import { cn } from "@/lib/utils";

type Detector = {
  detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
};

export function ScanBooth({
  onHit,
}: {
  onHit: (hit: ScanHit) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paste, setPaste] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef(0);

  useEffect(() => {
    return () => stopCam();
  }, []);

  function stopCam() {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }

  function emit(raw: string) {
    const hit = parseScan(raw);
    if (hit.kind === "unknown") {
      toast("That code is not Cash App, Coinbase, OpenSea, NFT, or a barcode.");
      return;
    }
    onHit(hit);
  }

  async function startCam() {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast("This booth needs a camera.");
      return;
    }
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setLive(true);
      const Detector = (
        window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }
      ).BarcodeDetector;
      const det = Detector
        ? new Detector({
            formats: [
              "qr_code",
              "ean_13",
              "ean_8",
              "upc_a",
              "upc_e",
              "code_128",
              "code_39",
              "codabar",
              "itf",
            ],
          })
        : null;
      const tick = async () => {
        const v = videoRef.current;
        const canvas = canvasRef.current;
        if (!v || v.readyState < 2 || !canvas) {
          loopRef.current = requestAnimationFrame(() => void tick());
          return;
        }
        try {
          if (det) {
            const codes = await det.detect(v);
            if (codes[0]?.rawValue) {
              emit(codes[0].rawValue);
              stopCam();
              return;
            }
          } else {
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              canvas.width = v.videoWidth;
              canvas.height = v.videoHeight;
              ctx.drawImage(v, 0, 0);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(img.data, img.width, img.height);
              if (code?.data) {
                emit(code.data);
                stopCam();
                return;
              }
            }
          }
        } catch {
          /* keep scanning */
        }
        loopRef.current = requestAnimationFrame(() => void tick());
      };
      loopRef.current = requestAnimationFrame(() => void tick());
    } catch {
      toast("Camera was refused. Paste a link instead.");
    } finally {
      setBusy(false);
    }
  }

  async function takeStill(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    const bmp = await createImageBitmap(file);
    const canvas = canvasRef.current;
    if (!canvas) {
      bmp.close();
      return;
    }
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bmp.close();
      return;
    }
    ctx.drawImage(bmp, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    bmp.close();
    const code = jsQR(img.data, img.width, img.height);
    if (code?.data) emit(code.data);
    else toast("No QR on that still.");
  }

  return (
    <div>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-void foil-frame",
          "aspect-[3/4] sm:aspect-video",
        )}
      >
        <video
          ref={videoRef}
          className="size-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="size-48 rounded-md shadow-[0_0_0_2px_var(--color-gold)] sm:size-56" />
        </div>
        {!live ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/70 p-4 text-center">
            <ScanLine className="size-8 text-gold" />
            <p className="max-w-xs text-sm text-ash">
              Point at a Cash App, Coinbase, OpenSea, NFT, or barcode. Or paste
              the link below. LinkScan can send a hit back here.
            </p>
            <Button type="button" disabled={busy} onClick={() => void startCam()}>
              <Camera className="size-4" />
              {busy ? "Arming…" : "Open camera"}
            </Button>
          </div>
        ) : (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <Button type="button" variant="void" onClick={stopCam}>
              Close camera
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <Label htmlFor="scan-paste">Paste a rail</Label>
          <Input
            id="scan-paste"
            value={paste}
            placeholder="cash.app/$tag · opensea · 0x… · barcode"
            onChange={(e) => setPaste(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && paste.trim()) emit(paste);
            }}
          />
        </div>
        <Button
          type="button"
          className="sm:mt-6"
          disabled={!paste.trim()}
          onClick={() => emit(paste)}
        >
          Read
        </Button>
      </div>

      <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 text-xs uppercase tracking-[0.14em] text-gold">
        <ImagePlus className="size-3.5" />
        Scan a still
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          suppressHydrationWarning
          onChange={(e) => void takeStill(e.target.files)}
        />
      </label>
    </div>
  );
}
