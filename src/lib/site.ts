export const HOUSE = {
  name: "I AM",
  artist: "Melitiamarie",
  handle: "melitiamarie",
  productions: "Melitia Marie Productions",
  tagline: "Her house. Play the tape. Scan a rail. Collect the 1/1.",
  location: "Los Angeles · 818",
  github: "https://github.com/Militiamarie/Iamapp",
  linkscan: "https://militiamarie.github.io/linkscan/",
  linkscanHub: "https://github.com/Militiamarie/linkscan",
  web: "https://melitiamarie.netlify.app",
  x: "https://x.com/melitiamarie",
  instagram: "https://instagram.com/militiamarie333",
  instagramAlt: "https://instagram.com/iammelitia_marie444",
  youtube: "https://www.youtube.com/@Melitiamarie",
  soundcloud: "https://soundcloud.com/melitiamarie",
  bandlab: "https://www.bandlab.com/melitiamarie_",
  rapchat: "https://rapchat.com/profile/AA30FDF0-2257-11ED-A1F1-C717B731CF00",
  rapfame: "https://rapfame.app/user/melitiamarie333",
  cdpPortal: "https://portal.cdp.coinbase.com/",
  partnerRef: "iam-mmp",
  coinbase: "https://www.coinbase.com/",
  opensea: "https://opensea.io/melitiamarie",
} as const;

export function liveOrigin() {
  if (typeof globalThis === "undefined") return "";
  const loc = (globalThis as { location?: { origin?: string } }).location;
  return loc?.origin ?? "";
}
