import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, LegalH } from "@/components/legal-doc";
import { HOUSE } from "@/lib/site";

export const Route = createFileRoute("/terms")({ component: Terms });

function Terms() {
  return (
    <LegalDoc
      kicker="House rules"
      title="Terms"
      lede="By entering I AM you agree to these terms. If you do not, leave the nave."
    >
      <p>Last updated September 8, 2026.</p>

      <LegalH>The house</LegalH>
      <p>
        I AM is a music, art, and collectible temple by {HOUSE.artist}. Catalog
        plates, rites, and demo vault balances are part of the house experience.
        Demo USDC and ETH in the connected vault are not real funds and have no
        cash value.
      </p>

      <LegalH>Live rails</LegalH>
      <p>
        Coinbase, Cash App, and OpenSea links open those products. Purchases,
        listings, and transfers on those rails are between you and that
        service. I AM is not a broker, wallet custodian, or NFT marketplace
        operator.
      </p>

      <LegalH>Your presses</LegalH>
      <p>
        Audio, stills, posts, and intents you create in studio, grimoire, or
        the wall stay yours. Do not mint or post work you do not have the right
        to use. You grant the house a license to display that work inside I AM
        on this device.
      </p>

      <LegalH>Conduct</LegalH>
      <p>
        No harassment, illegal content, or attempts to break the house. We may
        refuse service or reset local data if the house is abused.
      </p>

      <LegalH>Availability</LegalH>
      <p>
        The app is provided as-is. Music playback, scan, and on-ramps depend on
        your device, network, and third-party sites. We are not liable for lost
        demo collectibles, interrupted rites, or losses on outside rails.
      </p>

      <LegalH>Contact</LegalH>
      <p>
        Questions:{" "}
        <a className="text-gold" href={HOUSE.x} target="_blank" rel="noreferrer">
          @{HOUSE.handle}
        </a>
        .
      </p>
    </LegalDoc>
  );
}
