import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CollectCard } from "@/components/collect-card";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { RAIL_LABEL } from "@/lib/rails";
import { useIam } from "@/lib/store";

export const Route = createFileRoute("/feed")({ component: Feed });

function Feed() {
  const profile = useIam((s) => s.profile);
  const posts = useIam((s) => s.posts);
  const collects = useIam((s) => s.collects);
  const addPost = useIam((s) => s.addPost);
  const toggleLike = useIam((s) => s.toggleLike);
  const addComment = useIam((s) => s.addComment);
  const deleteComment = useIam((s) => s.deleteComment);

  const rows = useMemo(() => {
    const items: { at: number; key: string; kind: "post" | "scan" }[] = [
      ...posts.map((p) => ({ at: p.at, key: p.id, kind: "post" as const })),
      ...collects.map((c) => ({ at: c.at, key: c.id, kind: "scan" as const })),
    ];
    return items.sort((a, b) => b.at - a.at);
  }, [posts, collects]);

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-xs uppercase tracking-[0.22em] text-magenta">House</p>
      <h1 className="mt-1 text-3xl text-ivory uppercase sm:text-4xl">Feed</h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Wall posts and chain receipts, newest first. Heart it. Leave a line.
      </p>

      <div className="mx-auto mt-8 flex max-w-xl flex-col gap-4">
        <Composer
          onSave={(body, image, tags) => {
            const post = addPost(body, image, tags);
            if (!post) {
              toast("Write a line first.");
              return false;
            }
            toast("On the feed.");
            return true;
          }}
        />
        {rows.length === 0 ? (
          <div>
            <p className="text-sm text-ash">The feed is quiet.</p>
            <Button asChild className="mt-4">
              <Link to="/house">Open the house</Link>
            </Button>
          </div>
        ) : (
          rows.map((row) => {
            if (row.kind === "post") {
              const post = posts.find((p) => p.id === row.key);
              return post ? (
                <PostCard
                  key={post.id}
                  post={post}
                  profile={profile}
                  onLike={() => toggleLike(post.id)}
                  onComment={(name, body) => {
                    const c = addComment(post.id, name, body);
                    return Boolean(c);
                  }}
                  onDeleteComment={(id) => deleteComment(post.id, id)}
                />
              ) : null;
            }
            const c = collects.find((x) => x.id === row.key);
            return c ? (
              <CollectCard
                key={c.id}
                collect={c}
                kicker={`Scanned · ${RAIL_LABEL[c.kind]}`}
              />
            ) : null;
          })
        )}
      </div>
    </div>
  );
}
