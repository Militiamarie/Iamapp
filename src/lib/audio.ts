type ToneHandle = {
  ctx: AudioContext;
  osc: OscillatorNode;
  shimmer: OscillatorNode;
  gain: GainNode;
  analyser: AnalyserNode;
  timer?: number;
};

let handle: ToneHandle | null = null;

export function getAnalyser() {
  return handle?.analyser ?? null;
}

export function isTonePlaying() {
  return handle !== null;
}

export async function playTone(hz: number, durationMs?: number) {
  stopTone();
  const AudioCtx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  if (ctx.state === "suspended") await ctx.resume();

  const osc = ctx.createOscillator();
  const shimmer = ctx.createOscillator();
  const gain = ctx.createGain();
  const shimmerGain = ctx.createGain();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;

  osc.type = "sine";
  osc.frequency.value = hz;
  shimmer.type = "sine";
  shimmer.frequency.value = hz * 2;
  shimmerGain.gain.value = 0.03;

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.09, now + 0.35);

  osc.connect(gain);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(gain);
  gain.connect(analyser);
  analyser.connect(ctx.destination);

  osc.start();
  shimmer.start();

  handle = { ctx, osc, shimmer, gain, analyser };

  if (durationMs && durationMs > 0) {
    handle.timer = window.setTimeout(() => stopTone(), durationMs);
  }
}

export function stopTone() {
  if (!handle) return;
  const { ctx, osc, shimmer, gain, timer } = handle;
  if (timer) window.clearTimeout(timer);
  try {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    window.setTimeout(() => {
      try {
        osc.stop();
        shimmer.stop();
        void ctx.close();
      } catch {
        /* already closed */
      }
    }, 240);
  } catch {
    try {
      void ctx.close();
    } catch {
      /* ignore */
    }
  }
  handle = null;
}
