import { HOUSE } from "@/lib/site";
import { useIam } from "@/lib/store";

const STATIC = [
  { label: "Instagram", href: HOUSE.instagram },
  { label: "IG · 444", href: HOUSE.instagramAlt },
  { label: "YouTube", href: HOUSE.youtube },
  { label: "BandLab", href: HOUSE.bandlab },
  { label: "Rapchat", href: HOUSE.rapchat },
  { label: "Rap Fame", href: HOUSE.rapfame },
  { label: "SoundCloud", href: HOUSE.soundcloud },
  { label: "X", href: HOUSE.x },
] as const;

export function HouseLinks({ className }: { className?: string }) {
  const links = useIam((s) => s.profile.links);
  const live = [
    links.instagram ? { label: "Instagram", href: links.instagram } : STATIC[0],
    { label: "IG · 444", href: HOUSE.instagramAlt },
    links.youtube ? { label: "YouTube", href: links.youtube } : STATIC[2],
    links.bandlab ? { label: "BandLab", href: links.bandlab } : STATIC[3],
    links.rapchat ? { label: "Rapchat", href: links.rapchat } : STATIC[4],
    links.rapfame ? { label: "Rap Fame", href: links.rapfame } : STATIC[5],
    links.soundcloud ? { label: "SoundCloud", href: links.soundcloud } : STATIC[6],
    links.x ? { label: "X", href: links.x } : STATIC[7],
  ];

  return (
    <ul className={className ?? "flex flex-wrap gap-2"}>
      {live.map((item) => (
        <li key={item.label}>
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center rounded-full px-3 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)] hover:bg-gold/10"
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
