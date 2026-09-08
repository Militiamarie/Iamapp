import { create } from "zustand";
import { persist } from "zustand/middleware";
import { HOUSE_ARTIST, MINT_FEE_USDC, mergeCatalog } from "./catalog";
import { roundEth, roundUsdc, usdcToEth } from "./format";
import type { ScanHit } from "./rails";
import { plateFor, proceduralCover } from "./sigil";
import type {
  CatalogItem,
  ChainCollect,
  HouseComment,
  HousePost,
  HouseProfile,
  Kind,
  Owned,
  Rail,
  Shout,
  Ticket,
  Wallet,
} from "./types";

type MintDraft = {
  kind: Kind;
  title: string;
  creator: string;
  blurb: string;
  priceUsdc: number;
  freq?: number;
  quote?: string;
  intent?: string;
  reduced?: string;
  image?: string;
  tapeId?: string;
  audioName?: string;
  audioSrc?: string;
  youtubeId?: string;
};

type IamState = {
  ready: boolean;
  wallet: Wallet;
  minted: CatalogItem[];
  owned: Owned[];
  tickets: Ticket[];
  shouts: Shout[];
  profile: HouseProfile;
  posts: HousePost[];
  collects: ChainCollect[];
  connect: () => void;
  disconnect: () => void;
  pay: (rail: Rail, usdc: number) => boolean;
  buyItem: (itemId: string, rail: Rail) => boolean;
  mintItem: (draft: MintDraft, rail: Rail) => CatalogItem | null;
  buyTicket: (showId: string, rail: Rail, priceUsdc: number) => boolean;
  addShout: (name: string, message: string, rail: Rail, usdc: number) => boolean;
  saveProfile: (next: HouseProfile) => void;
  addPost: (body: string, image?: string, tags?: string[]) => HousePost | null;
  editPost: (id: string, body: string, image?: string, tags?: string[]) => boolean;
  deletePost: (id: string) => void;
  toggleLike: (id: string) => void;
  pinPost: (id: string) => void;
  addComment: (id: string, name: string, body: string) => HouseComment | null;
  deleteComment: (postId: string, commentId: string) => void;
  collectScan: (hit: ScanHit) => ChainCollect | null;
  catalog: () => CatalogItem[];
  isOwned: (itemId: string) => boolean;
  hasTicket: (showId: string) => boolean;
};

function makeAddress() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return `0x${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

const emptyWallet: Wallet = {
  connected: false,
  address: "",
  usdc: 250,
  eth: 0.12,
};

export const DEFAULT_PROFILE: HouseProfile = {
  name: HOUSE_ARTIST,
  handle: "melitiamarie",
  bio: "818. Rapper, producer, videographer. The tape is the receipt.",
  location: "Los Angeles · 818",
  avatar: "/art/emblem.jpg",
  cover: "/art/hero.jpg",
  links: {
    cashapp: "",
    coinbase: "",
    opensea: "",
    instagram: "https://instagram.com/militiamarie333",
    youtube: "https://www.youtube.com/@Melitiamarie",
    soundcloud: "https://soundcloud.com/melitiamarie",
    bandlab: "https://www.bandlab.com/melitiamarie_",
    x: "https://x.com/melitiamarie",
  },
};

const SEED_POSTS: HousePost[] = [
  {
    id: "post-i-could",
    body: "I Could is on the altar. Play it. Collect the 1/1. The house is open.",
    image: "/art/gold-mouth.jpg",
    tags: ["icould", "818", "tape"],
    at: Date.parse("2026-09-05T16:00:00Z"),
    likes: 48,
    liked: false,
    pinned: true,
    comments: [
      {
        id: "c-i-could-1",
        name: "THE ROOM",
        body: "This one stays on the wall.",
        at: Date.parse("2026-09-05T17:12:00Z"),
      },
    ],
  },
  {
    id: "post-who",
    body: "Who I Am. Melitiamarie. The house name. Write the wall. Scan a rail at the door.",
    image: "/art/temple-frequency.jpg",
    tags: ["whoiam", "house"],
    at: Date.parse("2026-09-05T18:30:00Z"),
    likes: 21,
    liked: false,
    pinned: false,
    comments: [],
  },
  {
    id: "post-scan",
    body: "Scan a Cash App, Coinbase, or OpenSea code at the door. Pay the altar. Collect onchain. Keep the receipt.",
    image: "/art/open-gate.jpg",
    tags: ["scan", "opensea", "cashapp"],
    at: Date.parse("2026-09-08T08:00:00Z"),
    likes: 12,
    liked: false,
    pinned: false,
    comments: [],
  },
];

function cleanTags(tags?: string[]) {
  return (tags ?? [])
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizePost(p: HousePost): HousePost {
  return {
    ...p,
    tags: p.tags ?? [],
    likes: typeof p.likes === "number" ? p.likes : 0,
    liked: Boolean(p.liked),
    pinned: Boolean(p.pinned),
    comments: Array.isArray(p.comments) ? p.comments : [],
  };
}

export const useIam = create<IamState>()(
  persist(
    (set, get) => ({
      ready: false,
      wallet: emptyWallet,
      minted: [],
      owned: [],
      tickets: [],
      shouts: [],
      profile: DEFAULT_PROFILE,
      posts: SEED_POSTS,
      collects: [],
      catalog: () => mergeCatalog(get().minted),
      isOwned: (itemId) => get().owned.some((o) => o.itemId === itemId),
      hasTicket: (showId) => get().tickets.some((t) => t.showId === showId),
      connect: () => {
        const { wallet } = get();
        const address = wallet.address || makeAddress();
        set({
          wallet: {
            ...wallet,
            address,
            connected: true,
            usdc: wallet.address ? wallet.usdc : emptyWallet.usdc,
            eth: wallet.address ? wallet.eth : emptyWallet.eth,
          },
        });
      },
      disconnect: () => {
        set({ wallet: { ...get().wallet, connected: false } });
      },
      pay: (rail, usdc) => {
        const { wallet } = get();
        if (!wallet.connected) return false;
        if (rail === "USDC") {
          if (wallet.usdc < usdc - 1e-9) return false;
          set({
            wallet: { ...wallet, usdc: roundUsdc(wallet.usdc - usdc) },
          });
          return true;
        }
        const eth = usdcToEth(usdc);
        if (wallet.eth < eth - 1e-9) return false;
        set({ wallet: { ...wallet, eth: roundEth(wallet.eth - eth) } });
        return true;
      },
      buyItem: (itemId, rail) => {
        const item = get().catalog().find((c) => c.id === itemId);
        if (!item) return false;
        if (get().isOwned(itemId)) return false;
        if (!get().pay(rail, item.priceUsdc)) return false;
        set({
          owned: [
            {
              itemId,
              rail,
              paidUsdc: item.priceUsdc,
              at: Date.now(),
            },
            ...get().owned,
          ],
        });
        return true;
      },
      mintItem: (draft, rail) => {
        if (!get().pay(rail, MINT_FEE_USDC)) return null;
        const id = `mint-${Date.now().toString(36)}`;
        const item: CatalogItem = {
          id,
          kind: draft.kind,
          title: draft.title.trim(),
          creator: draft.creator.trim() || "ANON",
          blurb: draft.blurb.trim(),
          image:
            draft.image ||
            (draft.kind === "sigil"
              ? plateFor(draft.reduced || draft.title || id)
              : proceduralCover(`${draft.title}:${draft.kind}:${id}`)),
          priceUsdc: draft.priceUsdc,
          edition: 1,
          freq: draft.freq,
          quote: draft.quote,
          minted: true,
          intent: draft.intent,
          reduced: draft.reduced,
          tapeId: draft.tapeId,
          audioName: draft.audioName,
          audioSrc: draft.audioSrc,
          youtubeId: draft.youtubeId,
        };
        set({
          minted: [item, ...get().minted],
          owned: [
            {
              itemId: id,
              rail,
              paidUsdc: MINT_FEE_USDC,
              at: Date.now(),
            },
            ...get().owned,
          ],
        });
        return item;
      },
      buyTicket: (showId, rail, priceUsdc) => {
        if (get().hasTicket(showId)) return false;
        if (!get().pay(rail, priceUsdc)) return false;
        set({
          tickets: [
            { showId, rail, paidUsdc: priceUsdc, at: Date.now() },
            ...get().tickets,
          ],
        });
        return true;
      },
      addShout: (name, message, rail, usdc) => {
        if (!get().pay(rail, usdc)) return false;
        const shout: Shout = {
          id: `shout-${Date.now().toString(36)}`,
          name: name.trim() || "ANON",
          message: message.trim(),
          rail,
          paidUsdc: usdc,
          at: Date.now(),
        };
        set({ shouts: [shout, ...get().shouts].slice(0, 24) });
        return true;
      },
      saveProfile: (next) => {
        set({
          profile: {
            ...next,
            name: next.name.trim() || HOUSE_ARTIST,
            handle: next.handle.replace(/^@/, "").trim() || "melitiamarie",
            bio: next.bio.trim(),
            location: next.location.trim(),
            links: { ...DEFAULT_PROFILE.links, ...next.links },
          },
        });
      },
      addPost: (body, image, tags) => {
        const text = body.trim();
        if (text.length < 2) return null;
        const post: HousePost = {
          id: `post-${Date.now().toString(36)}`,
          body: text.slice(0, 480),
          image,
          tags: cleanTags(tags),
          at: Date.now(),
          likes: 0,
          liked: false,
          pinned: false,
          comments: [],
        };
        set({ posts: [post, ...get().posts].slice(0, 80) });
        return post;
      },
      editPost: (id, body, image, tags) => {
        const text = body.trim();
        if (text.length < 2) return false;
        set({
          posts: get().posts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  body: text.slice(0, 480),
                  image,
                  tags: cleanTags(tags),
                  editedAt: Date.now(),
                }
              : p,
          ),
        });
        return true;
      },
      deletePost: (id) => {
        set({ posts: get().posts.filter((p) => p.id !== id) });
      },
      toggleLike: (id) => {
        set({
          posts: get().posts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  liked: !p.liked,
                  likes: Math.max(0, p.likes + (p.liked ? -1 : 1)),
                }
              : p,
          ),
        });
      },
      pinPost: (id) => {
        set({
          posts: get().posts.map((p) =>
            p.id === id ? { ...p, pinned: !p.pinned } : p,
          ),
        });
      },
      addComment: (id, name, body) => {
        const text = body.trim();
        if (text.length < 1) return null;
        const comment: HouseComment = {
          id: `c-${Date.now().toString(36)}`,
          name: name.trim() || "THE ROOM",
          body: text.slice(0, 240),
          at: Date.now(),
        };
        set({
          posts: get().posts.map((p) =>
            p.id === id
              ? { ...p, comments: [...p.comments, comment].slice(-40) }
              : p,
          ),
        });
        return comment;
      },
      deleteComment: (postId, commentId) => {
        set({
          posts: get().posts.map((p) =>
            p.id === postId
              ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
              : p,
          ),
        });
      },
      collectScan: (hit) => {
        if (hit.kind === "unknown" || !hit.url) return null;
        const existing = get().collects.find((c) => c.url === hit.url);
        if (existing) return existing;
        const row: ChainCollect = {
          id: `scan-${Date.now().toString(36)}`,
          kind: hit.kind,
          title: hit.title,
          url: hit.url,
          display: hit.display,
          at: Date.now(),
          raw: hit.raw,
        };
        set({ collects: [row, ...get().collects].slice(0, 60) });
        return row;
      },
    }),
    {
      name: "iam-temple",
      skipHydration: true,
      partialize: (s) => ({
        wallet: s.wallet,
        minted: s.minted,
        owned: s.owned,
        tickets: s.tickets,
        shouts: s.shouts,
        profile: s.profile,
        posts: s.posts,
        collects: s.collects,
      }),
    },
  ),
);

export function hydrateIam() {
  const done = () => {
    const s = useIam.getState();
    useIam.setState({
      profile: {
        ...DEFAULT_PROFILE,
        ...(s.profile ?? {}),
        links: { ...DEFAULT_PROFILE.links, ...(s.profile?.links ?? {}) },
      },
      posts: (s.posts?.length ? s.posts : SEED_POSTS).map(normalizePost),
      collects: s.collects ?? [],
      ready: true,
    });
  };
  const result = useIam.persist.rehydrate();
  if (result && typeof result.then === "function") {
    void result.then(done);
  } else {
    done();
  }
  useIam.setState({ ready: true });
}
