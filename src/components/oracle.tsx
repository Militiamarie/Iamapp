import { useRef, useState } from "react";
import { Ear, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { askListener, type OracleMessage } from "@/lib/oracle";
import { cn } from "@/lib/utils";

const STARTERS = [
  "How do I collect a 1/1?",
  "Where is all the music?",
  "How do I mint my own?",
] as const;

export function Oracle() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<OracleMessage[]>([]);
  const list = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const content = text.trim().slice(0, 500);
    if (!content || pending) return;
    const next: OracleMessage[] = [
      ...messages,
      { role: "user" as const, content },
    ].slice(-8);
    setMessages(next);
    setInput("");
    setPending(true);
    setError(null);
    try {
      const result = await askListener({ data: { messages: next } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessages((prev) =>
        [...prev, { role: "assistant" as const, content: result.text }].slice(-12),
      );
      requestAnimationFrame(() => {
        list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
      });
    } catch {
      setError("The nave did not answer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask the Listener"
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-md text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)] transition-colors duration-(--motion-quick) hover:bg-gold/10 sm:h-11 sm:w-auto sm:px-3 sm:text-xs sm:font-medium sm:uppercase sm:tracking-[0.14em]",
        )}
      >
        <Ear className="size-3.5" />
        <span className="hidden sm:inline">Listener</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[88dvh] w-[min(100%-1rem,28rem)] flex-col overflow-hidden">
          <DialogTitle>The Listener</DialogTitle>
          <DialogDescription>
            House oracle. Ask how to play, collect, trade, or mint a 1/1.
          </DialogDescription>
          <div
            ref={list}
            className="mt-4 flex min-h-48 flex-1 flex-col gap-3 overflow-y-auto pr-1"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-ash">
                  Every frequency finds an ear. Start with a line.
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((line) => (
                    <button
                      key={line}
                      type="button"
                      onClick={() => void send(line)}
                      className="min-h-11 rounded-full px-3 text-xs uppercase tracking-[0.12em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]"
                    >
                      {line}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <p
                  key={`${m.role}-${i}`}
                  className={cn(
                    "max-w-[92%] rounded-md px-3 py-2 text-sm",
                    m.role === "user"
                      ? "self-end bg-raised text-ivory"
                      : "self-start bg-void text-gold",
                  )}
                >
                  {m.content}
                </p>
              ))
            )}
            {pending ? (
              <p className="self-start text-xs uppercase tracking-[0.16em] text-ash">
                Listening…
              </p>
            ) : null}
            {error ? <p className="text-xs text-magenta">{error}</p> : null}
          </div>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Ask the nave"
              aria-label="Ask the Listener"
              className="min-h-11 flex-1 rounded-md bg-void px-3 text-sm text-ivory shadow-[0_0_0_1px_var(--color-border)] outline-none focus-visible:shadow-[0_0_0_1px_var(--color-gold)]"
            />
            <Button type="submit" disabled={pending || !input.trim()} size="sm">
              <Send className="size-3.5" />
              Send
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
