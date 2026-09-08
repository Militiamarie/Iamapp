import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { TapeBooth, type TapePick } from "@/components/tape-booth";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { HOUSE_ARTIST, MINT_FEE_USDC } from "@/lib/catalog";
import { formatUsdc } from "@/lib/format";
import { reduceIntent } from "@/lib/sigil";
import { useIam } from "@/lib/store";
import { KINDS, type Kind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mint")({ component: MintStudio });

function MintStudio() {
  const mintItem = useIam((s) => s.mintItem);
  const navigate = useNavigate();
  const [kind, setKind] = useState<Kind>("music");
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState(HOUSE_ARTIST);
  const [blurb, setBlurb] = useState("");
  const [price, setPrice] = useState("12");
  const [freq, setFreq] = useState("528");
  const [quote, setQuote] = useState("");
  const [intent, setIntent] = useState("");
  const [tape, setTape] = useState<TapePick | null>(null);
  const [open, setOpen] = useState(false);

  const reduced = useMemo(() => reduceIntent(intent), [intent]);
  const priceUsdc = Math.max(1, Number(price) || 1);
  const needsTape = kind === "music" || kind === "beat";
  const canPress =
    title.trim().length > 1 &&
    blurb.trim().length > 3 &&
    (!needsTape || Boolean(tape));

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
        Studio
      </p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">Mint</h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Drop a tape or record in the booth, then press a playable 1/1 into the
        market and vault. The altar takes {formatUsdc(MINT_FEE_USDC)} to stamp.
        List it on OpenSea from the{" "}
        <Link to="/altar" className="text-gold">
          altar
        </Link>
        .
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canPress) setOpen(true);
          }}
        >
          <div>
            <Label>Kind</Label>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKind(k.id)}
                  className={cn(
                    "min-h-11 rounded-full px-3 text-xs uppercase tracking-[0.14em]",
                    kind === k.id
                      ? "bg-gold text-void"
                      : "text-ash shadow-[0_0_0_1px_var(--color-border)]",
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Tape</Label>
            <TapeBooth
              value={tape}
              onPick={(next) => {
                setTape(next);
                if (next && !title.trim()) {
                  setTitle(next.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 48));
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={48}
              required
            />
          </div>
          <div>
            <Label htmlFor="creator">Creator</Label>
            <Input
              id="creator"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              placeholder={HOUSE_ARTIST}
              maxLength={32}
            />
          </div>
          <div>
            <Label htmlFor="blurb">Line</Label>
            <Textarea
              id="blurb"
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
              maxLength={180}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="price">List price (USDC)</Label>
              <Input
                id="price"
                type="number"
                min={1}
                step={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            {kind === "music" || kind === "beat" ? (
              <div>
                <Label htmlFor="freq">Frequency (Hz)</Label>
                <Input
                  id="freq"
                  type="number"
                  min={20}
                  max={2000}
                  value={freq}
                  onChange={(e) => setFreq(e.target.value)}
                />
              </div>
            ) : null}
            {kind === "quote" ? (
              <div>
                <Label htmlFor="quote">Quote</Label>
                <Input
                  id="quote"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  maxLength={80}
                />
              </div>
            ) : null}
          </div>
          {kind === "sigil" ? (
            <div>
              <Label htmlFor="intent">
                Intent ·{" "}
                <Link to="/grimoire" className="text-gold">
                  open the grimoire
                </Link>
              </Label>
              <Input
                id="intent"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="I AM ENOUGH"
              />
              {reduced ? (
                <p className="mt-2 font-mono text-sm tracking-[0.2em] text-gold">
                  {reduced}
                </p>
              ) : null}
            </div>
          ) : null}

          <Button type="submit" disabled={!canPress} className="mt-2 w-full sm:w-auto">
            Press for {formatUsdc(MINT_FEE_USDC)}
          </Button>
        </form>

        <aside className="rounded-lg bg-obsidian p-4 foil-frame">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ash">
            Preview
          </p>
          <h2 className="mt-2 font-display text-xl tracking-[0.12em] text-ivory uppercase">
            {title.trim() || "Untitled"}
          </h2>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold-dim">
            {(creator.trim() || HOUSE_ARTIST)} · 1/1 · {kind}
          </p>
          <p className="mt-3 text-sm text-ash">
            {blurb.trim() || "The line that rides the card."}
          </p>
          {tape ? (
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-gold">
              Playable · {tape.name}
            </p>
          ) : (
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-ash">
              No tape yet
            </p>
          )}
          <p className="mt-4 text-sm tabular-nums text-gold">
            {formatUsdc(priceUsdc)}
          </p>
        </aside>
      </div>

      <CheckoutDialog
        open={open}
        onOpenChange={setOpen}
        title={`Press · ${title.trim() || "Untitled"}`}
        blurb="1/1 into market + vault"
        priceUsdc={MINT_FEE_USDC}
        confirmLabel="Stamp"
        onConfirm={(rail) => {
          const item = mintItem(
            {
              kind,
              title,
              creator,
              blurb,
              priceUsdc,
              freq:
                kind === "music" || kind === "beat"
                  ? Number(freq) || undefined
                  : undefined,
              quote: kind === "quote" ? quote : undefined,
              intent: kind === "sigil" ? intent : undefined,
              reduced: kind === "sigil" ? reduced : undefined,
              tapeId: tape?.tapeId,
              audioName: tape?.name,
            },
            rail,
          );
          if (!item) return false;
          toast(`Pressed · ${item.title}`);
          void navigate({ to: "/vault" });
          return true;
        }}
      />
    </div>
  );
}
