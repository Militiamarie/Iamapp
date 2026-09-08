import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof globalThis.matchMedia !== "function") return false;
  const nav = (globalThis as { navigator?: Navigator & { standalone?: boolean } })
    .navigator;
  return (
    globalThis.matchMedia("(display-mode: standalone)").matches ||
    Boolean(nav?.standalone)
  );
}

function isIos() {
  const nav = (globalThis as { navigator?: Navigator }).navigator;
  if (!nav) return false;
  return /iphone|ipad|ipod/i.test(nav.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (sessionStorage.getItem("iam-install-dismissed") === "1") return;
    } catch {
      /* ignore */
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);

    if (isIos()) setHidden(false);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setHidden(true);
    setDeferred(null);
  }

  function dismiss() {
    setHidden(true);
    try {
      sessionStorage.setItem("iam-install-dismissed", "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-30 flex justify-center px-3 sm:top-16">
      <div className="pointer-events-auto mt-2 flex w-full max-w-md items-center gap-2 rounded-lg bg-surface px-3 py-2 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent),0_18px_40px_-20px_rgb(0_0_0_/_0.8)]">
        <Download className="size-4 shrink-0 text-gold" />
        <p className="min-w-0 flex-1 text-xs text-ivory">
          {deferred
            ? "Install I AM on this phone."
            : "Add I AM to your Home Screen."}
        </p>
        {deferred ? (
          <Button size="sm" onClick={() => void install()}>
            Install
          </Button>
        ) : (
          <Button size="sm" asChild>
            <Link to="/install">How</Link>
          </Button>
        )}
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="inline-flex size-11 items-center justify-center text-ash hover:text-ivory"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
