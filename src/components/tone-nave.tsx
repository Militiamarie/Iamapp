import { useEffect, useRef } from "react";
import { getAnalyser } from "@/lib/audio";

export function ToneNave({ playing }: { playing: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const data = new Uint8Array(128);

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const analyser = getAnalyser();
      let level = playing ? 0.45 : 0.22;
      if (analyser) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        level = Math.min(1, Math.sqrt(sum / data.length) * 6 + 0.22);
      }
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(width, height) * 0.42;
      const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, maxR * 1.2);
      glow.addColorStop(0, `rgba(212,175,55,${0.18 + level * 0.28})`);
      glow.addColorStop(0.45, `rgba(225,29,143,${0.08 + level * 0.12})`);
      glow.addColorStop(1, "rgba(10,7,6,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      for (let i = 6; i >= 1; i--) {
        const r = (maxR * i) / 6 + level * 14;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle =
          i % 2 === 0
            ? `rgba(212,175,55,${0.4 + level * 0.5})`
            : `rgba(225,29,143,${0.32 + level * 0.45})`;
        ctx.lineWidth = i === 1 ? 2.8 : 1.35;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 6 + level * 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(232,201,106,0.95)";
      ctx.fill();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return (
    <canvas
      ref={ref}
      width={720}
      height={420}
      className="h-56 w-full rounded-md bg-void sm:h-72"
    />
  );
}
