import { useState } from "react";
import { Heart, MessageCircle, Pencil, Pin, Trash2 } from "lucide-react";
import { Ago } from "@/components/ago";
import { Button } from "@/components/ui/button";
import type { HousePost, HouseProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PostCard({
  post,
  profile,
  onEdit,
  onDelete,
  onLike,
  onPin,
  onComment,
  onDeleteComment,
}: {
  post: HousePost;
  profile: HouseProfile;
  onEdit?: () => void;
  onDelete?: () => void;
  onLike?: () => void;
  onPin?: () => void;
  onComment?: (name: string, body: string) => boolean;
  onDeleteComment?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("THE ROOM");
  const [body, setBody] = useState("");

  return (
    <article className="rounded-lg bg-obsidian p-4 foil-frame">
      <header className="flex items-start gap-3">
        <img
          src={profile.avatar}
          alt=""
          className="size-11 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-ivory">
            {profile.name}
            {post.pinned ? (
              <span className="ml-2 text-xs uppercase tracking-[0.14em] text-gold">
                Pinned
              </span>
            ) : null}
          </p>
          <p className="text-xs uppercase tracking-[0.14em] text-ash">
            @{profile.handle} · <Ago at={post.at} />
            {post.editedAt ? " · edited" : ""}
          </p>
        </div>
        {onEdit || onDelete || onPin ? (
          <div className="flex">
            {onPin ? (
              <button
                type="button"
                className={cn(
                  "inline-flex size-11 items-center justify-center hover:text-gold",
                  post.pinned ? "text-gold" : "text-ash",
                )}
                onClick={onPin}
                aria-label={post.pinned ? "Unpin" : "Pin"}
              >
                <Pin className="size-3.5" />
              </button>
            ) : null}
            {onEdit ? (
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center text-ash hover:text-gold"
                onClick={onEdit}
                aria-label="Edit post"
              >
                <Pencil className="size-3.5" />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center text-ash hover:text-magenta"
                onClick={onDelete}
                aria-label="Delete post"
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
      </header>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ivory">
        {post.body}
      </p>
      {post.image ? (
        <img
          src={post.image}
          alt=""
          className="mt-3 max-h-96 w-full rounded-md object-cover"
        />
      ) : null}
      {post.tags.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <li
              key={t}
              className="rounded-full px-2 py-1 text-xs uppercase tracking-[0.14em] text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_35%,transparent)]"
            >
              #{t}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex items-center gap-1">
        {onLike ? (
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 px-2 text-xs uppercase tracking-[0.14em]",
              post.liked ? "text-magenta" : "text-ash hover:text-ivory",
            )}
            onClick={onLike}
            aria-label="Like"
          >
            <Heart className={cn("size-3.5", post.liked && "fill-magenta")} />
            {post.likes}
          </button>
        ) : (
          <span className="inline-flex min-h-11 items-center gap-1.5 px-2 text-xs uppercase tracking-[0.14em] text-ash">
            <Heart className="size-3.5" />
            {post.likes}
          </span>
        )}
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1.5 px-2 text-xs uppercase tracking-[0.14em] text-ash hover:text-ivory"
          onClick={() => setOpen((v) => !v)}
        >
          <MessageCircle className="size-3.5" />
          {post.comments.length}
        </button>
      </div>

      {open ? (
        <div className="mt-3 border-t border-border pt-3">
          {post.comments.length === 0 ? (
            <p className="text-sm text-ash">No lines yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {post.comments.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-gold">
                      {c.name} · <Ago at={c.at} />
                    </p>
                    <p className="mt-1 text-sm text-ivory">{c.body}</p>
                  </div>
                  {onDeleteComment ? (
                    <button
                      type="button"
                      className="inline-flex size-11 shrink-0 items-center justify-center text-ash hover:text-magenta"
                      onClick={() => onDeleteComment(c.id)}
                      aria-label="Delete comment"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {onComment ? (
            <form
              className="mt-3 flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!body.trim()) return;
                if (onComment(name, body)) setBody("");
              }}
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                aria-label="Name"
                className="w-full min-h-11 rounded-md bg-void px-3 text-sm text-ivory shadow-[0_0_0_1px_var(--color-border)]"
              />
              <div className="flex gap-2">
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={240}
                  placeholder="Leave a line…"
                  className="min-w-0 flex-1 min-h-11 rounded-md bg-void px-3 text-sm text-ivory shadow-[0_0_0_1px_var(--color-border)] placeholder:text-ash/70"
                />
                <Button type="submit" size="sm" disabled={!body.trim()}>
                  Send
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
