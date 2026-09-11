import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  MonitorSmartphone,
  Share,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HOUSE, liveOrigin } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/install")({ component: Install });

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detect() {
  if (typeof globalThis === "undefined") {
    return { ios: false, android: false, standalone: false };
  }
  const nav = (globalThis as { navigator?: Navigator }).navigator;
  const win = globalThis as unknown as Window;
  if (!nav || typeof win.matchMedia !== "function") {
    return { ios: false, android: false, standalone: false };
  }
  const ua = nav.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua);
  const android = /android/i.test(ua);
  const standalone =
    win.matchMedia("(display-mode: standalone)").matches ||
    Boolean((nav as Navigator & { standalone?: boolean }).standalone);
  return { ios, android, standalone };
}

function Install() {
  const [env, setEnv] = useState({
    ios: false,
    android: false,
    standalone: false,
  });
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const origin = liveOrigin();

  useEffect(() => {
    setEnv(detect());
    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  async function share() {
    const url = origin || HOUSE.github;
    try {
      if (navigator.share) {
        await navigator.share({
          title: HOUSE.name,
          text: HOUSE.tagline,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-magenta">
        Install
      </p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">
        Get the app
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        I AM lives on the web and installs like a native app — icon on the Home
        Screen, fullscreen, yours to open anytime. Apple App Store and Google
        Play listings need your developer accounts; this house is ready for
        them.
      </p>

      {env.standalone ? (
        <p className="mt-6 rounded-lg bg-obsidian px-4 py-3 text-sm text-gold foil-frame">
          You are already running I AM as an installed app.
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <PlatformCard
          icon={Smartphone}
          kicker="iPhone · iPad"
          title="Add to Home Screen"
          body="Open this house in Safari. Tap Share, then Add to Home Screen. The gold I lands next to your other apps."
          action={
            env.ios ? (
              <Button asChild className="w-full">
                <a href="?install=1&platform=ios">Show Safari steps</a>
              </Button>
            ) : (
              <p className="text-xs text-ash">
                Open this page in Safari on your iPhone to pin it.
              </p>
            )
          }
        />
        <PlatformCard
          icon={Download}
          kicker="Android"
          title="Install from Chrome"
          body="Chrome will offer Install app. Confirm and I AM sits on your launcher like any Play download."
          action={
            deferred ? (
              <Button className="w-full" onClick={() => void install()}>
                Install now
              </Button>
            ) : (
              <p className="text-xs text-ash">
                {env.android
                  ? "Use Chrome’s menu → Install app if the prompt has not appeared."
                  : "Open this page in Chrome on Android to install."}
              </p>
            )
          }
        />
        <PlatformCard
          icon={MonitorSmartphone}
          kicker="Web"
          title="Open on any phone"
          body="Share the live link. Anyone can play, collect, scan, and mint without an App Store wait."
          action={
            <Button variant="outline" className="w-full" onClick={() => void share()}>
              <Share className="size-3.5" />
              Share I AM
            </Button>
          }
        />
        <PlatformCard
          icon={Download}
          kicker="Stores"
          title="App Store · Google Play"
          body="Privacy, terms, support, and listing copy are in the house. Native store submission needs Apple Developer ($99/year) and Google Play Console ($25 once)."
          action={
            <Button asChild variant="outline" className="w-full">
              <a href={HOUSE.github} target="_blank" rel="noreferrer">
                Store packet on GitHub
              </a>
            </Button>
          }
        />
      </div>

      <section className="mt-12 rounded-lg bg-obsidian p-4 foil-frame sm:p-6">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold">
          What ships with the install
        </p>
        <ul className="mt-4 grid gap-3 text-sm text-ash sm:grid-cols-2">
          <li>Temple, market, vault, studio, and stage</li>
          <li>House wall, feed, and still editor</li>
          <li>QR / barcode scan for Cash App, Coinbase, OpenSea</li>
          <li>Tape booth — record or drop audio onto a 1/1</li>
          <li>Grimoire reducer and sigil plates</li>
          <li>Demo vault plus live Coinbase / Cash App / OpenSea rails</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/productions">Open Productions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/support">Support</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function PlatformCard({
  icon: Icon,
  kicker,
  title,
  body,
  action,
}: {
  icon: typeof Download;
  kicker: string;
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col rounded-lg bg-obsidian p-4 foil-frame sm:p-5")}>
      <Icon className="size-5 text-gold" />
      <p className="mt-3 text-[0.65rem] uppercase tracking-[0.18em] text-magenta">
        {kicker}
      </p>
      <h2 className="mt-1 text-lg text-ivory uppercase">{title}</h2>
      <p className="mt-2 flex-1 text-sm text-ash">{body}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}
