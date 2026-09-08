import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mic, Pause, Play, Ticket, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { ToneNave } from "@/components/tone-nave";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { RITES, SHOUT_TIERS } from "@/lib/catalog";
import { isTonePlaying, playTone, stopTone } from "@/lib/audio";
import { formatUsdc } from "@/lib/format";
import { asPlaySource, isPlayable, usePlayer } from "@/lib/player";
import { useIam } from "@/lib/store";
import type { Rite } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stage")({ component: Stage });

function Stage() {
  const tickets = useIam((s) => s.tickets);
  const buyTicket = useIam((s) => s.buyTicket);
  const shouts = useIam((s) => s.shouts);
  const addShout = useIam((s) => s.addShout);
  const play = usePlayer((s) => s.play);
  const togglePlay = usePlayer((s) => s.toggle);
  const stopPlay = usePlayer((s) => s.stop);
  const current = usePlayer((s) => s.current);
  const trackOn = usePlayer((s) => s.playing);
  const [active, setActive] = useState<Rite>(RITES[0]);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [shoutOpen, setShoutOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [tier, setTier] = useState<(typeof SHOUT_TIERS)[number]>(8);

  const ticketed = tickets.some((t) => t.showId === active.id);

  useEffect(() => {
    return () => stopTone();
  }, []);

  async function toggleTone() {
    if (playing || isTonePlaying()) {
      stopTone();
      setPlaying(false);
      return;
    }
    if (ticketed) {
      await playTone(active.freq);
      setPlaying(true);
      return;
    }
    await playTone(active.freq, 4000);
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), 4100);
    toast("Four-second preview. A ticket holds the tone.");
  }

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
        Nave
      </p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">Stage</h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Virtual rites. Tickets in USDC or ETH. Play Melitiamarie in the nave.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-xl foil-frame">
            <div className="relative">
              <img
                src={active.image}
                alt=""
                className="h-48 w-full object-cover sm:h-64"
              />
              <div className="absolute inset-0 scrim-b" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gold">
                  {active.slot}
                </p>
                <h2 className="font-display text-2xl tracking-[0.12em] text-ivory uppercase">
                  {active.title}
                </h2>
                <p className="text-sm text-ash">{active.artist}</p>
              </div>
            </div>
            <div className="bg-obsidian p-4 sm:p-5">
              <ToneNave playing={playing || (current?.id === active.id && trackOn)} />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => {
                    if (isPlayable(active)) {
                      if (current?.id === active.id) {
                        togglePlay();
                        return;
                      }
                      play(
                        asPlaySource({ ...active, creator: active.artist }),
                        RITES.map((r) =>
                          asPlaySource({ ...r, creator: r.artist }),
                        ),
                      );
                      return;
                    }
                    void toggleTone();
                  }}
                  variant="gold"
                >
                  {isPlayable(active) ? (
                    current?.id === active.id && trackOn ? (
                      <>
                        <Pause className="size-4" />
                        Silence
                      </>
                    ) : (
                      <>
                        <Play className="size-4" />
                        Play the tape
                      </>
                    )
                  ) : playing ? (
                    <>
                      <VolumeX className="size-4" />
                      Silence
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-4" />
                      {ticketed ? `Hold ${active.freq}Hz` : `Preview ${active.freq}Hz`}
                    </>
                  )}
                </Button>
                {ticketed ? (
                  <span className="inline-flex min-h-11 items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-gold">
                    <Ticket className="size-3.5" />
                    Ticket held
                  </span>
                ) : (
                  <Button variant="outline" onClick={() => setTicketOpen(true)}>
                    <Ticket className="size-4" />
                    Ticket · {formatUsdc(active.priceUsdc)}
                  </Button>
                )}
              </div>
              <p className="mt-3 text-sm text-ash">{active.blurb}</p>
            </div>
          </div>

          <ul className="mt-4 grid gap-2">
            {RITES.map((rite) => {
              const on = rite.id === active.id;
              return (
                <li key={rite.id}>
                  <button
                    type="button"
                    onClick={() => {
                      stopTone();
                      setPlaying(false);
                      stopPlay();
                      setActive(rite);
                    }}
                    className={cn(
                      "flex w-full min-h-14 items-center gap-3 rounded-md px-3 text-left transition-[box-shadow,background-color] duration-(--motion-quick)",
                      on
                        ? "bg-raised shadow-[0_0_0_1px_var(--color-gold)]"
                        : "bg-obsidian shadow-[0_0_0_1px_var(--color-border)]",
                    )}
                  >
                    <img
                      src={rite.image}
                      alt=""
                      className="size-10 rounded-sm object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-sm tracking-[0.1em] text-ivory uppercase">
                        {rite.title}
                      </span>
                      <span className="block text-[0.65rem] uppercase tracking-[0.14em] text-ash">
                        {rite.artist} · {rite.slot}
                      </span>
                    </span>
                    <span className="text-xs tabular-nums text-gold">
                      {rite.freq}Hz
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside>
          <div className="rounded-lg bg-obsidian p-4 foil-frame sm:p-5">
            <div className="flex items-center gap-2">
              <Mic className="size-4 text-magenta" />
              <h2 className="text-lg text-ivory uppercase">On-mic shoutouts</h2>
            </div>
            <p className="mt-2 text-sm text-ash">
              Pay to put a line in the nave queue. Same USDC / ETH rails.
            </p>
            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (message.trim()) setShoutOpen(true);
              }}
            >
              <div>
                <Label htmlFor="shout-name">Name</Label>
                <Input
                  id="shout-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  placeholder="ANON"
                />
              </div>
              <div>
                <Label htmlFor="shout-msg">Line</Label>
                <Textarea
                  id="shout-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={80}
                  className="min-h-20"
                  required
                />
              </div>
              <div className="flex gap-2">
                {SHOUT_TIERS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTier(n)}
                    className={cn(
                      "min-h-11 flex-1 rounded-md text-xs tabular-nums",
                      tier === n
                        ? "bg-magenta text-ivory"
                        : "text-ash shadow-[0_0_0_1px_var(--color-border)]",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <Button type="submit" variant="magenta" disabled={!message.trim()}>
                Queue · {formatUsdc(tier)}
              </Button>
            </form>
          </div>

          <ol className="mt-4 flex flex-col gap-2">
            {shouts.length === 0 ? (
              <li className="text-sm text-ash">No shouts in the nave yet.</li>
            ) : (
              shouts.map((s) => (
                <li
                  key={s.id}
                  className="rounded-md bg-obsidian px-3 py-3 shadow-[0_0_0_1px_var(--color-border)]"
                >
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-gold">
                    {s.name}
                  </p>
                  <p className="mt-1 text-sm text-ivory">{s.message}</p>
                </li>
              ))
            )}
          </ol>
        </aside>
      </div>

      <CheckoutDialog
        open={ticketOpen}
        onOpenChange={setTicketOpen}
        title={`Ticket · ${active.title}`}
        blurb={`${active.freq}Hz held open`}
        priceUsdc={active.priceUsdc}
        confirmLabel="Take the ticket"
        onConfirm={(rail) => {
          const ok = buyTicket(active.id, rail, active.priceUsdc);
          if (ok) toast(`Ticket · ${active.title}`);
          return ok;
        }}
      />
      <CheckoutDialog
        open={shoutOpen}
        onOpenChange={setShoutOpen}
        title="On-mic shoutout"
        blurb={message}
        priceUsdc={tier}
        confirmLabel="Send the line"
        onConfirm={(rail) => {
          const ok = addShout(name, message, rail, tier);
          if (ok) {
            toast("Shout queued");
            setMessage("");
          }
          return ok;
        }}
      />
    </div>
  );
}
