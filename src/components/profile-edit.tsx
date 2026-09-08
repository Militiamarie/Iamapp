import { useId, useState } from "react";
import { toast } from "sonner";
import { StillEditor } from "@/components/still-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { isImageFile } from "@/lib/media";
import type { StillAspect } from "@/lib/still";
import type { HouseLinks, HouseProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "identity" | "rails" | "stills";

export function ProfileEdit({
  open,
  onOpenChange,
  profile,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: HouseProfile;
  onSave: (next: HouseProfile) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [tab, setTab] = useState<Tab>("identity");
  const avId = useId();
  const covId = useId();
  const [editSrc, setEditSrc] = useState<string | undefined>();
  const [editAspect, setEditAspect] = useState<StillAspect>("1:1");
  const [editField, setEditField] = useState<"avatar" | "cover" | null>(null);

  function field<K extends keyof HouseProfile>(key: K, value: HouseProfile[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function link<K extends keyof HouseLinks>(key: K, value: HouseLinks[K]) {
    setDraft((d) => ({ ...d, links: { ...d.links, [key]: value } }));
  }

  function takeStill(which: "avatar" | "cover", list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    if (!isImageFile(file)) {
      toast("Drop a still — png, jpg, webp.");
      return;
    }
    setEditField(which);
    setEditAspect(which === "avatar" ? "1:1" : "3:1");
    setEditSrc(URL.createObjectURL(file));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(profile);
          setTab("identity");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="w-[min(100%-1rem,32rem)] max-h-[88dvh] overflow-y-auto">
        <DialogTitle>Edit house</DialogTitle>
        <DialogDescription>
          Identity, stills, and the rails collectors pay on.
        </DialogDescription>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["identity", "Identity"],
              ["stills", "Stills"],
              ["rails", "Rails"],
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

        {tab === "identity" ? (
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                value={draft.name}
                maxLength={32}
                onChange={(e) => field("name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="p-handle">Handle</Label>
              <Input
                id="p-handle"
                value={draft.handle}
                maxLength={24}
                onChange={(e) => field("handle", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="p-loc">Location</Label>
              <Input
                id="p-loc"
                value={draft.location}
                maxLength={48}
                onChange={(e) => field("location", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="p-bio">Bio</Label>
              <Textarea
                id="p-bio"
                value={draft.bio}
                maxLength={220}
                onChange={(e) => field("bio", e.target.value)}
              />
              <p className="mt-1 text-right font-mono text-xs text-ash">
                {draft.bio.length}/220
              </p>
            </div>
          </div>
        ) : null}

        {tab === "stills" ? (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label htmlFor={avId} className="cursor-pointer">
                <img
                  src={draft.avatar}
                  alt=""
                  className="size-20 rounded-full object-cover"
                />
              </label>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-ash">Avatar</p>
                <label
                  htmlFor={avId}
                  className="mt-2 inline-flex min-h-11 cursor-pointer items-center text-xs uppercase tracking-[0.14em] text-gold"
                >
                  Grade a new still
                </label>
              </div>
              <input
                id={avId}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => takeStill("avatar", e.target.files)}
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-ash">Cover</p>
              <label htmlFor={covId} className="mt-2 block cursor-pointer">
                <img
                  src={draft.cover}
                  alt=""
                  className="h-28 w-full rounded-md object-cover"
                />
              </label>
              <input
                id={covId}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => takeStill("cover", e.target.files)}
              />
            </div>
          </div>
        ) : null}

        {tab === "rails" ? (
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <Label htmlFor="p-cash">Cash App cashtag</Label>
              <Input
                id="p-cash"
                value={draft.links.cashapp}
                placeholder="$melitiamarie"
                onChange={(e) => link("cashapp", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="p-cb">Coinbase</Label>
              <Input
                id="p-cb"
                value={draft.links.coinbase}
                placeholder="wallet.coinbase.com or 0x…"
                onChange={(e) => link("coinbase", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="p-os">OpenSea</Label>
              <Input
                id="p-os"
                value={draft.links.opensea}
                placeholder="opensea.io/melitiamarie"
                onChange={(e) => link("opensea", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="p-ig">Instagram</Label>
              <Input
                id="p-ig"
                value={draft.links.instagram}
                onChange={(e) => link("instagram", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="p-yt">YouTube</Label>
              <Input
                id="p-yt"
                value={draft.links.youtube}
                onChange={(e) => link("youtube", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="p-sc">SoundCloud</Label>
              <Input
                id="p-sc"
                value={draft.links.soundcloud}
                onChange={(e) => link("soundcloud", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="p-bl">BandLab</Label>
              <Input
                id="p-bl"
                value={draft.links.bandlab}
                onChange={(e) => link("bandlab", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="p-x">X</Label>
              <Input
                id="p-x"
                value={draft.links.x}
                onChange={(e) => link("x", e.target.value)}
              />
            </div>
          </div>
        ) : null}

        <Button
          type="button"
          className="mt-5 w-full"
          onClick={() => {
            onSave(draft);
            onOpenChange(false);
            toast("House updated.");
          }}
        >
          Save house
        </Button>

        <StillEditor
          open={Boolean(editField)}
          src={editSrc}
          aspect={editAspect}
          lockAspect
          title={editField === "cover" ? "Grade cover" : "Grade avatar"}
          onOpenChange={(next) => {
            if (!next) {
              if (editSrc?.startsWith("blob:")) URL.revokeObjectURL(editSrc);
              setEditField(null);
            }
          }}
          onApply={(jpeg) => {
            if (editField) field(editField, jpeg);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
