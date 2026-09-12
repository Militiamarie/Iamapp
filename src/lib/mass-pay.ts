import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isEthAddress } from "./chain";

export type PayAsset = "BTC" | "USDC" | "ETH";

export type Payee = {
  id: string;
  included: boolean;
  name: string;
  role: string;
  btc: string;
  evm: string;
  amount: string;
  asset: PayAsset;
  memo: string;
};

const BTC_RE =
  /^(bc1[qp][a-z0-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;

export function isBtcAddress(value: string) {
  return BTC_RE.test(value.trim());
}

export function newPayee(partial?: Partial<Payee>): Payee {
  return {
    id: crypto.randomUUID(),
    included: true,
    name: "",
    role: "",
    btc: "",
    evm: "",
    amount: "",
    asset: "BTC",
    memo: "",
    ...partial,
  };
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function parseAmount(value: string) {
  const n = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function unchainedRows(payees: Payee[]) {
  return payees.filter(
    (p) => p.included && isBtcAddress(p.btc) && parseAmount(p.amount) > 0,
  );
}

export function baseRows(payees: Payee[], asset: "USDC" | "ETH") {
  return payees.filter(
    (p) =>
      p.included &&
      p.asset === asset &&
      isEthAddress(p.evm) &&
      parseAmount(p.amount) > 0,
  );
}

/** Unchained vault batch spend — Vault → Withdraw → Multiple addresses. Amount in BTC. Max 500. */
export function toUnchainedCsv(payees: Payee[]) {
  const rows = unchainedRows(payees).slice(0, 500);
  const body = rows
    .map((p) => `${p.btc.trim()},${parseAmount(p.amount)}`)
    .join("\n");
  return `address,amount\n${body}${body ? "\n" : ""}`;
}

export function toBaseCsv(payees: Payee[], asset: "USDC" | "ETH") {
  const rows = baseRows(payees, asset);
  const header = "address,amount,asset,memo,name";
  const body = rows
    .map((p) =>
      [
        p.evm.trim(),
        String(parseAmount(p.amount)),
        asset,
        csvEscape(p.memo),
        csvEscape(p.name),
      ].join(","),
    )
    .join("\n");
  return `${header}\n${body}${body ? "\n" : ""}`;
}

export function toHubJson(payees: Payee[]) {
  return JSON.stringify(
    {
      house: "I AM",
      artist: "Melitiamarie",
      productions: "Melitia Marie Productions",
      rails: ["unchained", "base-usdc", "base-eth"],
      updated: new Date().toISOString(),
      note: "CSV is the Unchained upload. Signing stays in your vault. This house never holds keys.",
      totals: totals(payees),
      payees: payees.map((p) => ({
        name: p.name,
        role: p.role,
        included: p.included,
        asset: p.asset,
        amount: parseAmount(p.amount) || p.amount,
        memo: p.memo,
        btc: p.btc,
        evm: p.evm,
      })),
    },
    null,
    2,
  );
}

export function totals(payees: Payee[]) {
  const btc = unchainedRows(payees).reduce((s, p) => s + parseAmount(p.amount), 0);
  const usdc = baseRows(payees, "USDC").reduce(
    (s, p) => s + parseAmount(p.amount),
    0,
  );
  const eth = baseRows(payees, "ETH").reduce((s, p) => s + parseAmount(p.amount), 0);
  return {
    btcPayees: unchainedRows(payees).length,
    usdcPayees: baseRows(payees, "USDC").length,
    ethPayees: baseRows(payees, "ETH").length,
    btc,
    usdc,
    eth,
  };
}

export function parsePastedCsv(text: string): Payee[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (!lines.length) return [];
  const header = lines[0].toLowerCase();
  const start = /address|btc|evm|amount/.test(header) ? 1 : 0;
  const out: Payee[] = [];
  for (const line of lines.slice(start)) {
    const cols = splitCsvLine(line);
    const [a, b, c, d, e] = cols;
    const first = (a ?? "").trim();
    if (isBtcAddress(first)) {
      out.push(
        newPayee({
          btc: first,
          amount: (b ?? "").trim(),
          asset: "BTC",
          name: (c ?? "").trim(),
          memo: (d ?? "").trim(),
        }),
      );
    } else if (isEthAddress(first)) {
      const asset: PayAsset =
        /eth/i.test(c ?? "") ? "ETH" : "USDC";
      out.push(
        newPayee({
          evm: first,
          amount: (b ?? "").trim(),
          asset,
          memo: (d ?? c ?? "").trim(),
          name: (e ?? "").trim(),
        }),
      );
    }
  }
  return out;
}

function splitCsvLine(line: string) {
  const cols: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        q = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      q = true;
    } else if (ch === ",") {
      cols.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols;
}

export function downloadText(filename: string, body: string, mime: string) {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type MassPayState = {
  ready: boolean;
  payees: Payee[];
  add: (partial?: Partial<Payee>) => void;
  update: (id: string, patch: Partial<Payee>) => void;
  remove: (id: string) => void;
  importRows: (rows: Payee[], mode: "replace" | "append") => void;
  clear: () => void;
};

export const useMassPay = create<MassPayState>()(
  persist(
    (set, get) => ({
      ready: false,
      payees: [],
      add: (partial) =>
        set({ payees: [...get().payees, newPayee(partial)] }),
      update: (id, patch) =>
        set({
          payees: get().payees.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }),
      remove: (id) => {
        const next = get().payees.filter((p) => p.id !== id);
        set({ payees: next.length ? next : [newPayee({ role: "split" })] });
      },
      importRows: (rows, mode) => {
        if (!rows.length) return;
        set({
          payees:
            mode === "replace" ? rows : [...get().payees, ...rows],
        });
      },
      clear: () => set({ payees: [newPayee({ role: "split" })] }),
    }),
    {
      name: "iam-mass-pay",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.ready = true;
        if (!state.payees.length) {
          state.payees = [newPayee({ role: "split" })];
        }
      },
    },
  ),
);

export function hydrateMassPay() {
  useMassPay.persist.rehydrate();
  const s = useMassPay.getState();
  if (!s.payees.length) {
    useMassPay.setState({ ready: true, payees: [newPayee({ role: "split" })] });
  } else {
    useMassPay.setState({ ready: true });
  }
}
