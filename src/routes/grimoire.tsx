import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { IntentFire } from "@/components/intent-fire";
import { SigilPlate } from "@/components/sigil-plate";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MINT_FEE_USDC } from "@/lib/catalog";
import { formatUsdc } from "@/lib/format";
import { reduceIntent } from "@/lib/sigil";
import { useIam } from "@/lib/store";

export const Route = createFileRoute("/grimoire")({ component: Grimoire });

const RITES = [
  {
    img: "/art/grimoire-quill.jpg",
    kicker: "I",
    title: "Write the vow",
    body: "A sentence you mean. The page takes it in gold ink.",
  },
  {
    img: "/art/grimoire-burn.jpg",
    kicker: "II",
    title: "Vowels burn",
    body: "A, E, I, O, U fall to ash. Duplicate consonants follow.",
  },
  {
    img: "/art/grimoire-wax.jpg",
    kicker: "III",
    title: "Stamp the plate",
    body: "What remains locks into a 1/1 sigil on the lectern.",
  },
] as const;

function Grimoire() {
  const mintItem = useIam((s) => s.mintItem);
  const navigate = useNavigate();
  const [intent, setIntent] = useState("I AM ENOUGH");
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);
  const reduced = useMemo(() => reduceIntent(intent), [intent]);
  const cardName = title.trim() || intent.trim() || "Untitled sigil";

  return (
    <div className="pt-6 sm:pt-10">
      <NaveHero />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <div className="relative overflow-hidden rounded-xl foil-frame">
          <img
            src="/art/grimoire-page.jpg"
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 scrim-book" />
          <form
            className="relative flex flex-col gap-5 p-5 sm:p-7"
            onSubmit={(e) => {
              e.preventDefault();
              if (reduced) setOpen(true);
            }}
          >
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
                Statement of intent
              </p>
              <Label htmlFor="intent" className="sr-only">
                Statement of intent
              </Label>
              <Textarea
                id="intent"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                maxLength={120}
                className="mt-2 min-h-32 bg-void/80 font-display text-lg tracking-[0.12em] uppercase"
              />
            </div>

            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-gold">
                The fire
              </p>
              <div className="mt-3">
                <IntentFire intent={intent} />
              </div>
            </div>

            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-ash">
                Reduced letters
              </p>
              <p className="mt-1 font-mono text-2xl tracking-[0.28em] text-gold sm:text-3xl">
                {reduced || "—"}
              </p>
            </div>

            <div>
              <Label htmlFor="sigil-title">Name on the card</Label>
              <Input
                id="sigil-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={intent.trim() || "Untitled sigil"}
                maxLength={48}
                className="bg-void/80"
              />
            </div>

            <Button type="submit" disabled={!reduced} className="w-full sm:w-auto">
              Press sigil · {formatUsdc(MINT_FEE_USDC)}
            </Button>
          </form>
        </div>

        <SigilPlate
          reduced={reduced}
          title={cardName}
          className="mx-auto w-full max-w-sm lg:max-w-none"
        />
      </div>

      <div className="foil-rule my-10" />

      <section>
        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
          Rite
        </p>
        <h2 className="mt-1 text-2xl text-ivory uppercase">How the page burns</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {RITES.map((rite) => (
            <article
              key={rite.kicker}
              className="overflow-hidden rounded-lg bg-obsidian foil-frame"
            >
              <div className="relative aspect-square overflow-hidden bg-void">
                <img
                  src={rite.img}
                  alt=""
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 scrim-b" />
                <span className="absolute top-3 left-3 font-display text-sm tracking-[0.2em] text-gold">
                  {rite.kicker}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg tracking-[0.12em] text-ivory uppercase">
                  {rite.title}
                </h3>
                <p className="mt-2 text-sm text-ash">{rite.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CheckoutDialog
        open={open}
        onOpenChange={setOpen}
        title={`Sigil · ${cardName}`}
        blurb={reduced}
        priceUsdc={MINT_FEE_USDC}
        confirmLabel="Stamp the sigil"
        onConfirm={(rail) => {
          const item = mintItem(
            {
              kind: "sigil",
              title: cardName,
              creator: "THE REDUCER",
              blurb: `Reduced from “${intent.trim()}” → ${reduced}.`,
              priceUsdc: 13,
              intent: intent.trim(),
              reduced,
            },
            rail,
          );
          if (!item) return false;
          toast(`Sigil pressed · ${reduced}`);
          void navigate({ to: "/vault" });
          return true;
        }}
      />
    </div>
  );
}

function NaveHero() {
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMotion(!mq.matches);
    const onChange = () => setMotion(!mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-xl foil-frame">
      <div className="relative h-[min(50vh,420px)]">
        <img
          src="/art/grimoire-hero.jpg"
          alt="Open grimoire on the gold lectern"
          className="absolute inset-0 size-full object-cover"
        />
        {motion ? (
          <video
            className="absolute inset-0 size-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/art/grimoire-hero.jpg"
          >
            <source src="/art/grimoire-hero.mp4" type="video/mp4" />
          </video>
        ) : null}
        <div className="absolute inset-0 scrim-b" />
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-10">
          <p className="text-[0.65rem] uppercase tracking-[0.32em] text-gold">
            Reducer
          </p>
          <h1 className="mt-1 foil-text font-display text-5xl tracking-[0.18em] uppercase sm:text-7xl">
            Grimoire
          </h1>
          <p className="mt-3 max-w-md text-sm text-ivory sm:text-base">
            Write an intent. Vowels burn. Duplicate consonants fall. The
            remaining letters lock into a gold-and-magenta plate you press to
            the vault.
          </p>
        </div>
      </div>
    </section>
  );
}
