export const KINDS = [
  { id: "music", label: "Music" },
  { id: "beat", label: "Beats" },
  { id: "spell", label: "Spells" },
  { id: "sigil", label: "Sigils" },
  { id: "deity", label: "Deity" },
  { id: "quote", label: "Quotes" },
] as const;

export type Kind = (typeof KINDS)[number]["id"];
export type Rail = "USDC" | "ETH";

export type CatalogItem = {
  id: string;
  kind: Kind;
  title: string;
  creator: string;
  blurb: string;
  image: string;
  priceUsdc: number;
  edition: number;
  freq?: number;
  quote?: string;
  minted?: boolean;
  intent?: string;
  reduced?: string;
  audioSrc?: string;
  youtubeId?: string;
  soundcloudUrl?: string;
  tapeId?: string;
  audioName?: string;
  onchain?: {
    chain: "base";
    contract: string;
    tokenId: string;
    tx: string;
  };
};

export type Owned = {
  itemId: string;
  rail: Rail;
  paidUsdc: number;
  at: number;
};

export type Ticket = {
  showId: string;
  rail: Rail;
  paidUsdc: number;
  at: number;
};

export type Shout = {
  id: string;
  name: string;
  message: string;
  rail: Rail;
  paidUsdc: number;
  at: number;
};

export type Wallet = {
  connected: boolean;
  address: string;
  usdc: number;
  eth: number;
  provider: "demo" | "metamask" | "coinbase" | "injected" | "";
};

export type Rite = {
  id: string;
  title: string;
  artist: string;
  slot: string;
  freq: number;
  priceUsdc: number;
  image: string;
  blurb: string;
  audioSrc?: string;
  youtubeId?: string;
};

export type HouseLinks = {
  cashapp: string;
  coinbase: string;
  opensea: string;
  instagram: string;
  youtube: string;
  soundcloud: string;
  bandlab: string;
  x: string;
  rapchat: string;
  rapfame: string;
};

export type HouseProfile = {
  name: string;
  handle: string;
  bio: string;
  location: string;
  avatar: string;
  cover: string;
  links: HouseLinks;
};

export type HouseComment = {
  id: string;
  name: string;
  body: string;
  at: number;
};

export type HousePost = {
  id: string;
  body: string;
  image?: string;
  tags: string[];
  at: number;
  editedAt?: number;
  likes: number;
  liked: boolean;
  pinned: boolean;
  comments: HouseComment[];
};

export type ChainCollect = {
  id: string;
  kind: "cashapp" | "coinbase" | "opensea" | "eth";
  title: string;
  url: string;
  display: string;
  image?: string;
  at: number;
  raw: string;
};
