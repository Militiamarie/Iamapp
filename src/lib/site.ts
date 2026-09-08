export const HOUSE = {
  name: "I AM",
  artist: "Melitiamarie",
  handle: "melitiamarie",
  tagline: "Her house. Play the tape. Scan a rail. Collect the 1/1.",
  location: "Los Angeles · 818",
  github: "https://github.com/Militiamarie/Iamapp",
  x: "https://x.com/melitiamarie",
  instagram: "https://instagram.com/militiamarie333",
  youtube: "https://www.youtube.com/@Melitiamarie",
  soundcloud: "https://soundcloud.com/melitiamarie",
  bandlab: "https://www.bandlab.com/melitiamarie_",
} as const;

export function liveOrigin() {
  if (typeof globalThis === "undefined") return "";
  const loc = (globalThis as { location?: { origin?: string } }).location;
  return loc?.origin ?? "";
}
