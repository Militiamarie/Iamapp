import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Flame, MapPin, Pencil, QrCode, ScanLine, Stamp } from "lucide-react";
import { toast } from "sonner";
import { CollectCard } from "@/components/collect-card";
import { Composer } from "@/components/composer";
import { HouseLinks } from "@/components/house-links";
import { PostCard } from "@/components/post-card";
import { ProfileEdit } from "@/components/profile-edit";
import { RailQr } from "@/components/rail-qr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cashPayUrl, houseRails } from "@/lib/rails";
import { useIam } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/house")({ component: House });

type Tab = "wall" | "grid" | "collect";

function House() {
  const profile = useIam((s) => s.profile);
  const posts = useIam((s) => s.posts);
  const collects = useIam((s) => s.collects);
  const minted = useIam((s) => s.minted);
  const saveProfile = useIam((s) => s.saveProfile);
  const addPost = useIam((s) => s.addPost);
  const editPost = useIam((s) => s.editPost);
  const deletePost = useIam((s) => s.deletePost);
  const toggleLike = useIam((s) => s.toggleLike);
  const pinPost = useIam((s) => s.pinPost);
  const addComment = useIam((s) => s.addComment);
  const deleteComment = useIam((s) => s.deleteComment);
  const [tab, setTab] = useState<Tab>("wall");
  const [editing, setEditing] = useState<string | null>(null);
  const [editHouse, setEditHouse] = useState(false);
  const [pay, setPay] = useState(false);
  const [openStill, setOpenStill] = useState<string | null>(null);

  const wall = useMemo(
    () =>
      [...posts].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at - a.at),
    [posts],
  );
  const grid = useMemo(() => posts.filter((p) => p.image), [posts]);
  const rails = houseRails(profile);
  const cash = profile.links.cashapp
    ? {
        label: "Cash App",
        href: cashPayUrl(profile.links.cashapp.replace(/^\$/, "")),
      }
    : null;

  return (
    <div className="pt-0">
      <section className="relative overflow-hidden rounded-b-xl foil-frame">
        <img
          src={profile.cover}
          alt=""
          className="h-44 w-full object-cover sm:h-56"
        />
        <div className="absolute inset-0 scrim-b" />
      </section>

      <div className="relative px-1 sm:px-0">
        <img
          src={profile.avatar}
          alt=""
          className="-mt-10 size-20 rounded-full object-cover shadow-[0_0_0_3px_var(--color-void)] sm:-mt-12 sm:size-24"
        />
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl text-ivory uppercase sm:text-4xl">
              {profile.name}
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold">
              @{profile.handle}
            </p>
            {profile.location ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ash">
                <MapPin className="size-3.5" />
                {profile.location}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setEditHouse(true)}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button type="button" variant="outline" onClick={() => setPay(true)}>
              <QrCode className="size-3.5" />
              Scan me
            </Button>
            <Button asChild variant="outline">
              <Link to="/scan">
                <ScanLine className="size-3.5" />
                Scan
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/altar">
                <Flame className="size-3.5" />
                Onchain
              </Link>
            </Button>
            <Button asChild>
              <Link to="/mint">
                <Stamp className="size-3.5" />
                Studio
              </Link>
            </Button>
          </div>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ivory">
          {profile.bio}
        </p>
        <ul className="mt-4 flex gap-6 text-sm">
          <li>
            <span className="font-mono text-gold">{posts.length}</span>
            <span className="ml-1.5 uppercase tracking-[0.14em] text-ash">Posts</span>
          </li>
          <li>
            <span className="font-mono text-gold">{collects.length}</span>
            <span className="ml-1.5 uppercase tracking-[0.14em] text-ash">Collect</span>
          </li>
          <li>
            <span className="font-mono text-gold">{minted.length}</span>
            <span className="ml-1.5 uppercase tracking-[0.14em] text-ash">1/1</span>
          </li>
        </ul>
        <ul className="mt-4 flex flex-wrap gap-2">
          {cash ? (
            <li>
              <a
                href={cash.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]"
              >
                Cash App
                <ExternalLink className="size-3" />
              </a>
            </li>
          ) : null}
          {rails
            .filter((r) => r.kind !== "cashapp")
            .map((r) => (
              <li key={r.label}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_40%,transparent)]"
                >
                  {r.label}
                  <ExternalLink className="size-3" />
                </a>
              </li>
            ))}
        </ul>
        <HouseLinks className="mt-3 flex flex-wrap gap-2" />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ["wall", "Wall"],
            ["grid", "Grid"],
            ["collect", "Collect"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "min-h-11 rounded-full px-4 text-xs uppercase tracking-[0.14em]",
              tab === id
                ? "bg-gold text-void"
                : "text-ash shadow-[0_0_0_1px_var(--color-border)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "wall" ? (
        <div className="mx-auto mt-6 flex max-w-xl flex-col gap-4">
          <Composer
            onSave={(body, image, tags) => {
              const post = addPost(body, image, tags);
              if (!post) {
                toast("Write a line first.");
                return false;
              }
              toast("On the wall.");
              return true;
            }}
          />
          {wall.map((post) =>
            editing === post.id ? (
              <Composer
                key={post.id}
                initial={post}
                submitLabel="Save"
                onCancel={() => setEditing(null)}
                onSave={(body, image, tags) => {
                  const ok = editPost(post.id, body, image, tags);
                  if (ok) {
                    setEditing(null);
                    toast("Edited.");
                  }
                  return ok;
                }}
              />
            ) : (
              <PostCard
                key={post.id}
                post={post}
                profile={profile}
                onEdit={() => setEditing(post.id)}
                onDelete={() => {
                  deletePost(post.id);
                  toast("Pulled from the wall.");
                }}
                onLike={() => toggleLike(post.id)}
                onPin={() => pinPost(post.id)}
                onComment={(name, body) => {
                  const row = addComment(post.id, name, body);
                  if (!row) return false;
                  toast("On the thread.");
                  return true;
                }}
                onDeleteComment={(id) => deleteComment(post.id, id)}
              />
            ),
          )}
        </div>
      ) : null}

      {tab === "grid" ? (
        <div className="mt-6 grid grid-cols-3 gap-1 sm:gap-2">
          {grid.length === 0 ? (
            <p className="col-span-3 text-sm text-ash">
              No stills on the wall yet. Write a post with a still.
            </p>
          ) : (
            grid.map((post) => (
              <button
                key={post.id}
                type="button"
                className="aspect-square overflow-hidden bg-obsidian"
                onClick={() => setOpenStill(post.id)}
              >
                <img src={post.image} alt="" className="size-full object-cover" />
              </button>
            ))
          )}
        </div>
      ) : null}

      {tab === "collect" ? (
        <div className="mx-auto mt-6 flex max-w-xl flex-col gap-4">
          {collects.length === 0 ? (
            <div>
              <p className="text-sm text-ash">
                No chain receipts yet. Scan a Cash App, Coinbase, or OpenSea
                code.
              </p>
              <Button asChild className="mt-4">
                <Link to="/scan">Open scanner</Link>
              </Button>
            </div>
          ) : (
            collects.map((c) => <CollectCard key={c.id} collect={c} />)
          )}
        </div>
      ) : null}

      <ProfileEdit
        open={editHouse}
        onOpenChange={setEditHouse}
        profile={profile}
        onSave={saveProfile}
      />

      <Dialog open={pay} onOpenChange={setPay}>
        <DialogContent className="w-[min(100%-1rem,32rem)] max-h-[88dvh] overflow-y-auto">
          <DialogTitle>Scan me</DialogTitle>
          <DialogDescription>
            Flash Cash App, Coinbase, or OpenSea in the room. The code opens
            the real rail.
          </DialogDescription>
          {rails.length === 0 ? (
            <div className="mt-4">
              <p className="text-sm text-ash">
                Set a cashtag, Coinbase wallet, or OpenSea in Edit house first.
              </p>
              <Button
                type="button"
                className="mt-4"
                onClick={() => {
                  setPay(false);
                  setEditHouse(true);
                }}
              >
                Edit rails
              </Button>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {rails.map((r) => (
                <RailQr key={r.label} rail={r} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(openStill)} onOpenChange={() => setOpenStill(null)}>
        <DialogContent className="w-[min(100%-1rem,32rem)] max-h-[88dvh] overflow-y-auto">
          <DialogTitle>Wall still</DialogTitle>
          <DialogDescription>From the house grid.</DialogDescription>
          {openStill
            ? (() => {
                const post = posts.find((p) => p.id === openStill);
                return post ? (
                  <div className="mt-4">
                    <PostCard
                      post={post}
                      profile={profile}
                      onLike={() => toggleLike(post.id)}
                      onComment={(name, body) =>
                        Boolean(addComment(post.id, name, body))
                      }
                    />
                  </div>
                ) : null;
              })()
            : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
