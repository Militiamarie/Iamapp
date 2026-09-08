import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, LegalH } from "@/components/legal-doc";
import { HOUSE } from "@/lib/site";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  return (
    <LegalDoc
      kicker="Policy"
      title="Privacy"
      lede="I AM is Melitiamarie’s temple. This page is what we keep, what we don’t, and how to reach the house."
    >
      <p>Last updated September 8, 2026.</p>

      <LegalH>Who we are</LegalH>
      <p>
        I AM is operated by {HOUSE.artist} ({HOUSE.location}). Contact:{" "}
        <a className="text-gold" href={HOUSE.x} target="_blank" rel="noreferrer">
          @{HOUSE.handle} on X
        </a>
        .
      </p>

      <LegalH>What stays on your device</LegalH>
      <p>
        The house vault, profile, wall posts, tickets, and scanned rails are
        stored in this browser (local storage and IndexedDB for tapes you
        record). They are not uploaded to our servers. Clearing site data on
        this device erases them. Support has a reset control.
      </p>

      <LegalH>Camera and microphone</LegalH>
      <p>
        Scan uses the camera only while the scanner is open, on this device, to
        read a QR or barcode. Studio can record audio if you start a take. We
        never receive those streams. You can deny permission in the browser;
        the rest of the house still works.
      </p>

      <LegalH>Outside rails</LegalH>
      <p>
        Coinbase, Cash App, OpenSea, Instagram, YouTube, SoundCloud, BandLab,
        and X are separate services. If you follow a rail out of the house,
        their privacy policies apply. I AM does not custody crypto, cash, or
        NFTs.
      </p>

      <LegalH>Hosting</LegalH>
      <p>
        The published site is served over HTTPS. Standard server logs (IP,
        user agent, pages requested) may be retained by the host for security
        and uptime. We do not sell personal information. We do not run
        advertising trackers.
      </p>

      <LegalH>Children</LegalH>
      <p>
        I AM is not directed at children under 13. Do not use the house if you
        are under 13.
      </p>

      <LegalH>Changes</LegalH>
      <p>
        If this policy changes in a material way, the date at the top will
        move. Keep using the house after that date and you accept the update.
      </p>
    </LegalDoc>
  );
}
