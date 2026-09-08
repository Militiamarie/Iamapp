export function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name);
}

export function isAudioFile(file: File) {
  return (
    file.type.startsWith("audio/") ||
    /\.(mp3|m4a|wav|ogg|aac|flac|webm)$/i.test(file.name)
  );
}

/** Accept a raw id or a watch / youtu.be / embed / shorts URL. */
export function parseYoutubeId(raw: string): string | undefined {
  const s = raw.trim();
  if (!s) return undefined;
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : undefined;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      if (
        (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") &&
        parts[1] &&
        /^[a-zA-Z0-9_-]{11}$/.test(parts[1])
      ) {
        return parts[1];
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}
