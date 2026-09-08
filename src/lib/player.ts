import { create } from "zustand";
import { isPlayable } from "./catalog";
import { tapeUrl } from "./tape";

export type PlaySource = {
  id: string;
  title: string;
  creator: string;
  image: string;
  audioSrc?: string;
  youtubeId?: string;
  tapeId?: string;
};

type PlayerState = {
  current: PlaySource | null;
  queue: PlaySource[];
  playing: boolean;
  t: number;
  duration: number;
  mode: "idle" | "native" | "youtube";
  play: (src: PlaySource, queue?: PlaySource[]) => void;
  toggle: () => void;
  seek: (t: number) => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
};

type YTPlayer = {
  loadVideoById: (id: string) => void;
  cueVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (s: number, allow: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: string | HTMLElement,
        opts: Record<string, unknown>,
      ) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let audio: HTMLAudioElement | null = null;
let yt: YTPlayer | null = null;
let ytHost: HTMLElement | null = null;
let ytReady: Promise<void> | null = null;
let ytWaiters: Array<() => void> = [];
let tick: number | null = null;
let generation = 0;

function ensureAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = "auto";
  audio.addEventListener("timeupdate", () => {
    if (usePlayer.getState().mode !== "native") return;
    usePlayer.setState({
      t: audio?.currentTime ?? 0,
      duration: Number.isFinite(audio?.duration) ? (audio?.duration ?? 0) : 0,
    });
  });
  audio.addEventListener("ended", () => usePlayer.getState().next());
  audio.addEventListener("play", () => {
    if (usePlayer.getState().mode === "native") {
      usePlayer.setState({ playing: true });
    }
  });
  audio.addEventListener("pause", () => {
    if (usePlayer.getState().mode === "native") {
      usePlayer.setState({ playing: false });
    }
  });
  return audio;
}

function stopNative() {
  if (!audio) return;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
}

function pauseYt() {
  try {
    yt?.pauseVideo();
  } catch {
    /* ignore */
  }
}

function loadYtApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (ytReady) return ytReady;
  ytReady = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector("script[data-iam-yt]")) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.dataset.iamYt = "1";
      document.head.appendChild(s);
    }
  });
  return ytReady;
}

export function attachYtHost(el: HTMLElement | null) {
  if (!el && yt) {
    try {
      yt.destroy();
    } catch {
      /* ignore */
    }
    yt = null;
  }
  ytHost = el;
  ytWaiters.splice(0).forEach((fn) => fn());
}

function waitForHost(): Promise<HTMLElement> {
  if (ytHost) return Promise.resolve(ytHost);
  return new Promise((resolve) => {
    ytWaiters.push(() => {
      if (ytHost) resolve(ytHost);
    });
  });
}

async function ensureYt(): Promise<YTPlayer> {
  await loadYtApi();
  const host = await waitForHost();
  if (yt) return yt;
  const Player = window.YT!.Player;
  yt = new Player(host, {
    events: {
      onReady: () => {
        try {
          yt?.playVideo();
        } catch {
          /* ignore */
        }
      },
      onStateChange: (e: { data: number }) => {
        const S = window.YT?.PlayerState;
        if (!S) return;
        if (usePlayer.getState().mode !== "youtube") return;
        if (e.data === S.PLAYING) usePlayer.setState({ playing: true });
        if (e.data === S.PAUSED) usePlayer.setState({ playing: false });
        if (e.data === S.ENDED) usePlayer.getState().next();
      },
      onError: () => {
        if (usePlayer.getState().mode === "youtube") {
          usePlayer.setState({ playing: false });
        }
      },
    },
  });
  await new Promise<void>((resolve) => {
    const started = Date.now();
    const wait = () => {
      try {
        if (yt && typeof yt.getPlayerState === "function") {
          resolve();
          return;
        }
      } catch {
        /* constructing */
      }
      if (Date.now() - started > 8000) {
        resolve();
        return;
      }
      requestAnimationFrame(wait);
    };
    wait();
  });
  return yt!;
}

function startTick() {
  if (tick) window.clearInterval(tick);
  tick = window.setInterval(() => {
    const { mode } = usePlayer.getState();
    if (mode === "youtube" && yt) {
      try {
        usePlayer.setState({
          t: yt.getCurrentTime() || 0,
          duration: yt.getDuration() || 0,
        });
      } catch {
        /* ignore */
      }
    }
  }, 400);
}

async function playNative(src: string, gen: number) {
  const el = ensureAudio();
  pauseYt();
  el.src = src;
  usePlayer.setState({ mode: "native", t: 0, duration: 0, playing: true });
  try {
    await el.play();
  } catch {
    if (gen !== generation) return;
    usePlayer.setState({ playing: false });
  }
}

async function startYoutube(id: string, gen: number) {
  stopNative();
  usePlayer.setState({ mode: "youtube", t: 0, duration: 0, playing: true });
  try {
    const player = await ensureYt();
    if (gen !== generation) return;
    player.loadVideoById(id);
    player.playVideo();
    startTick();
  } catch {
    if (gen !== generation) return;
    usePlayer.setState({ playing: false });
  }
}

async function startSource(src: PlaySource, gen: number) {
  if (src.tapeId) {
    const url = await tapeUrl(src.tapeId);
    if (gen !== generation) return;
    if (url) {
      await playNative(url, gen);
      return;
    }
  }
  if (src.audioSrc) {
    const el = ensureAudio();
    const ok = await new Promise<boolean>((resolve) => {
      const onOk = () => {
        cleanup();
        resolve(true);
      };
      const onErr = () => {
        cleanup();
        resolve(false);
      };
      const cleanup = () => {
        el.removeEventListener("canplay", onOk);
        el.removeEventListener("error", onErr);
      };
      el.addEventListener("canplay", onOk);
      el.addEventListener("error", onErr);
      pauseYt();
      el.src = src.audioSrc!;
      el.load();
      window.setTimeout(() => resolve(el.readyState >= 2), 2500);
    });
    if (gen !== generation) return;
    if (ok) {
      usePlayer.setState({ mode: "native", playing: true });
      try {
        await el.play();
      } catch {
        usePlayer.setState({ playing: false });
      }
      return;
    }
  }
  if (src.youtubeId) {
    await startYoutube(src.youtubeId, gen);
    return;
  }
  usePlayer.setState({ playing: false, mode: "idle" });
}

export const usePlayer = create<PlayerState>((set, get) => ({
  current: null,
  queue: [],
  playing: false,
  t: 0,
  duration: 0,
  mode: "idle",
  play: (src, queue) => {
    generation += 1;
    const gen = generation;
    const nextQueue =
      queue && queue.length
        ? queue
        : get().queue.some((q) => q.id === src.id)
          ? get().queue
          : [src, ...get().queue.filter((q) => q.id !== src.id)];
    set({ current: src, queue: nextQueue, t: 0, duration: 0, playing: true });
    void startSource(src, gen);
  },
  toggle: () => {
    const { current, playing, mode } = get();
    if (!current) return;
    if (playing) {
      if (mode === "native") ensureAudio().pause();
      if (mode === "youtube") pauseYt();
      set({ playing: false });
      return;
    }
    if (mode === "native") {
      void ensureAudio().play();
      set({ playing: true });
      return;
    }
    if (mode === "youtube") {
      try {
        yt?.playVideo();
        set({ playing: true });
      } catch {
        get().play(current, get().queue);
      }
      return;
    }
    get().play(current, get().queue);
  },
  seek: (t) => {
    const { mode } = get();
    if (mode === "native" && audio) {
      audio.currentTime = t;
      set({ t });
    }
    if (mode === "youtube" && yt) {
      try {
        yt.seekTo(t, true);
        set({ t });
      } catch {
        /* ignore */
      }
    }
  },
  next: () => {
    const { queue, current } = get();
    if (!current || queue.length < 2) {
      set({ playing: false });
      return;
    }
    const i = queue.findIndex((q) => q.id === current.id);
    const nxt = queue[(i + 1) % queue.length];
    if (nxt) get().play(nxt, queue);
  },
  prev: () => {
    const { queue, current, t } = get();
    if (t > 4) {
      get().seek(0);
      return;
    }
    if (!current || queue.length < 2) {
      get().seek(0);
      return;
    }
    const i = queue.findIndex((q) => q.id === current.id);
    const prv = queue[(i - 1 + queue.length) % queue.length];
    if (prv) get().play(prv, queue);
  },
  stop: () => {
    generation += 1;
    stopNative();
    pauseYt();
    set({
      current: null,
      playing: false,
      t: 0,
      duration: 0,
      mode: "idle",
    });
  },
}));

export function asPlaySource(item: {
  id: string;
  title: string;
  creator?: string;
  artist?: string;
  image: string;
  audioSrc?: string;
  youtubeId?: string;
  tapeId?: string;
}): PlaySource {
  return {
    id: item.id,
    title: item.title,
    creator: item.creator || item.artist || "MELITIAMARIE",
    image: item.image,
    audioSrc: item.audioSrc,
    youtubeId: item.youtubeId,
    tapeId: item.tapeId,
  };
}

export { isPlayable };

export function formatClock(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}
