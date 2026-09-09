import { useEffect, useRef } from "react";
import { ExternalLink, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { attachYtHost, formatClock, usePlayer } from "@/lib/player";
import { cn } from "@/lib/utils";

export function NowPlaying() {
  const current = usePlayer((s) => s.current);
  const playing = usePlayer((s) => s.playing);
  const t = usePlayer((s) => s.t);
  const duration = usePlayer((s) => s.duration);
  const mode = usePlayer((s) => s.mode);
  const toggle = usePlayer((s) => s.toggle);
  const seek = usePlayer((s) => s.seek);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const stop = usePlayer((s) => s.stop);
  const host = useRef<HTMLIFrameElement>(null);
  const ytId = current?.youtubeId && mode !== "native" ? current.youtubeId : null;

  useEffect(() => {
    attachYtHost(host.current);
    return () => attachYtHost(null);
  }, [ytId]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-14 z-30 border-t border-border bg-void/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:bottom-0",
        !current && "invisible pointer-events-none",
      )}
      aria-hidden={!current}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 sm:px-6">
        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-sm bg-obsidian sm:h-20 sm:w-36">
          {current ? (
            <img
              src={current.image}
              alt=""
              className={cn(
                "size-full object-cover",
                ytId && "opacity-0",
              )}
            />
          ) : null}
          <iframe
            ref={host}
            id="iam-yt"
            title={current ? `${current.title} tape` : "tape"}
            className={cn("absolute inset-0 size-full border-0", !ytId && "invisible")}
            src={
              ytId
                ? `https://www.youtube-nocookie.com/embed/${ytId}?enablejsapi=1&autoplay=1&rel=0&playsinline=1&modestbranding=1`
                : "about:blank"
            }
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm tracking-[0.12em] text-ivory uppercase">
            {current?.title ?? "I AM"}
          </p>
          <p className="truncate text-[0.65rem] uppercase tracking-[0.16em] text-gold-dim">
            {current?.creator ?? "MELITIAMARIE"}
            {ytId ? " · tape" : current?.tapeId ? " · booth" : ""}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="w-8 font-mono text-[0.6rem] tabular-nums text-ash">
              {formatClock(t)}
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(1, duration)}
              step={0.1}
              value={Math.min(t, duration || 0)}
              aria-label="Seek"
              suppressHydrationWarning
              onChange={(e) => seek(Number(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-raised accent-gold"
            />
            <span className="w-8 text-right font-mono text-[0.6rem] tabular-nums text-ash">
              {formatClock(duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {ytId ? (
            <a
              href={`https://www.youtube.com/watch?v=${ytId}`}
              target="_blank"
              rel="noreferrer"
              className="grid size-11 place-items-center text-ash hover:text-gold"
              aria-label="Open on YouTube"
            >
              <ExternalLink className="size-4" />
            </a>
          ) : null}
          <button
            type="button"
            onClick={prev}
            className="grid size-11 place-items-center text-ash hover:text-ivory"
            aria-label="Previous"
          >
            <SkipBack className="size-4" />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="grid size-11 place-items-center rounded-full bg-gold text-void"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4 translate-x-px" />
            )}
          </button>
          <button
            type="button"
            onClick={next}
            className="grid size-11 place-items-center text-ash hover:text-ivory"
            aria-label="Next"
          >
            <SkipForward className="size-4" />
          </button>
          <button
            type="button"
            onClick={stop}
            className="grid size-11 place-items-center text-ash hover:text-ivory"
            aria-label="Close player"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
