import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HOUSE } from "@/lib/site";

export const Route = createFileRoute("/support")({ component: Support });

function Support() {
  function resetHouse() {
    try {
      localStorage.removeItem("iam-temple");
      indexedDB.deleteDatabase("iam-tapes");
      toast("House reset. Reload to start clean.");
    } catch {
      toast("Could not reset on this device.");
    }
  }

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
        Help
      </p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">
        Support
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        The house is Melitiamarie’s. Write on X, or handle the usual repairs
        below.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-obsidian p-4 foil-frame sm:p-5">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold">
            Reach the house
          </p>
          <p className="mt-2 text-sm text-ash">
            Fastest line is X. Include your device and what broke.
          </p>
          <Button asChild className="mt-4">
            <a href={HOUSE.x} target="_blank" rel="noreferrer">
              Message @{HOUSE.handle}
            </a>
          </Button>
        </div>
        <div className="rounded-lg bg-obsidian p-4 foil-frame sm:p-5">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold">
            Install
          </p>
          <p className="mt-2 text-sm text-ash">
            iPhone uses Safari → Share → Add to Home Screen. Android uses
            Chrome → Install app.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/install">Get the app</Link>
          </Button>
        </div>
      </section>

      <section className="mt-8 max-w-2xl">
        <h2 className="text-lg text-ivory uppercase">Common fixes</h2>
        <ul className="mt-4 space-y-3 text-sm text-ash">
          <li>
            <span className="text-ivory">No sound.</span> Unlock audio with a
            tap on the plate or the nave. iOS blocks autoplay until then.
          </li>
          <li>
            <span className="text-ivory">Scan will not open.</span> Allow camera
            for this site in Safari or Chrome settings.
          </li>
          <li>
            <span className="text-ivory">Studio will not record.</span> Allow
            microphone. Drop a file instead of recording if you prefer.
          </li>
          <li>
            <span className="text-ivory">Vault looks empty.</span> Collectibles
            live on this device only. A new browser is a new vault.
          </li>
        </ul>
      </section>

      <section className="mt-10 max-w-md rounded-lg bg-obsidian p-4 foil-frame sm:p-5">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-magenta">
          Reset
        </p>
        <p className="mt-2 text-sm text-ash">
          Clears the demo vault, wall, and tapes stored on this device. Outside
          wallets are untouched.
        </p>
        <Button variant="outline" className="mt-4" onClick={resetHouse}>
          Reset this device
        </Button>
      </section>
    </div>
  );
}
