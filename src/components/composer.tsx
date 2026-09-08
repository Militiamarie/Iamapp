import { useId, useRef, useState } from "react";
import { ImagePlus, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { StillEditor } from "@/components/still-editor";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { isImageFile } from "@/lib/media";
import type { StillAspect } from "@/lib/still";
import type { HousePost } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Composer({
  initial,
  onSave,
  onCancel,
  submitLabel = "Post",
}: {
  initial?: HousePost;
  onSave: (body: string, image: string | undefined, tags: string[]) => boolean;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState(initial?.body ?? "");
  const [image, setImage] = useState<string | undefined>(initial?.image);
  const [tags, setTags] = useState((initial?.tags ?? []).join(" "));
  const [editSrc, setEditSrc] = useState<string | undefined>();
  const [editing, setEditing] = useState(false);
  const [aspect, setAspect] = useState<StillAspect>("4:5");
  const can = body.trim().length > 1;

  function take(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    if (!isImageFile(file)) {
      toast("Drop a still — png, jpg, webp.");
      return;
    }
    const url = URL.createObjectURL(file);
    setEditSrc(url);
    setAspect("4:5");
    setEditing(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form
      className="rounded-lg bg-obsidian p-4 foil-frame"
      onSubmit={(e) => {
        e.preventDefault();
        if (!can) return;
        const tagList = tags
          .split(/[\s,]+/)
          .map((t) => t.replace(/^#/, "").trim())
          .filter(Boolean);
        const ok = onSave(body, image, tagList);
        if (ok && !initial) {
          setBody("");
          setImage(undefined);
          setTags("");
        }
      }}
    >
      <Label htmlFor="wall-body">{initial ? "Edit the line" : "Write the wall"}</Label>
      <Textarea
        id="wall-body"
        value={body}
        maxLength={480}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Bars, drops, receipts…"
        required
      />
      <p className="mt-1 text-right font-mono text-xs text-ash">{body.length}/480</p>

      {image ? (
        <div className="relative mt-3 overflow-hidden rounded-md">
          <img src={image} alt="" className="max-h-72 w-full object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full bg-void/80 text-ivory"
              onClick={() => {
                setEditSrc(image);
                setEditing(true);
              }}
              aria-label="Edit still"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full bg-void/80 text-ivory"
              onClick={() => setImage(undefined)}
              aria-label="Remove still"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <Label htmlFor="wall-tags">Tags</Label>
        <input
          id="wall-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="818 tape opensea"
          className="w-full min-h-11 rounded-md bg-void px-3 text-sm text-ivory shadow-[0_0_0_1px_var(--color-border)] placeholder:text-ash/70"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          className={cn(
            "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_45%,transparent)]",
          )}
        >
          <ImagePlus className="size-3.5" />
          Still
        </label>
        <input
          ref={fileRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => take(e.target.files)}
        />
        <div className="ml-auto flex gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={!can}>
            {submitLabel}
          </Button>
        </div>
      </div>

      <StillEditor
        open={editing}
        src={editSrc}
        aspect={aspect}
        title="Grade the still"
        onOpenChange={(next) => {
          setEditing(next);
          if (!next && editSrc?.startsWith("blob:")) URL.revokeObjectURL(editSrc);
        }}
        onApply={(jpeg) => setImage(jpeg)}
      />
    </form>
  );
}
