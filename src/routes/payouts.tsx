import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  Banknote,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { isEthAddress } from "@/lib/chain";
import {
  baseRows,
  downloadText,
  isBtcAddress,
  parsePastedCsv,
  toBaseCsv,
  toHubJson,
  toUnchainedCsv,
  totals,
  unchainedRows,
  useMassPay,
  type PayAsset,
  type Payee,
} from "@/lib/mass-pay";
import { useOnchain } from "@/lib/onchain";
import { HOUSE } from "@/lib/site";

export const Route = createFileRoute("/payouts")({
  component: Payouts,
});

const UNCHAINED_HELP =
  "https://www.unchained.com/blog/batch-spending-for-vaults";
const UNCHAINED_APP = "https://app.unchained.com/";
const HUB_PAYOUTS = `${HOUSE.github}/tree/main/payouts`;

function Payouts() {
  const payees = useMassPay((s) => s.payees);
  const add = useMassPay((s) => s.add);
  const update = useMassPay((s) => s.update);
  const remove = useMassPay((s) => s.remove);
  const importRows = useMassPay((s) => s.importRows);
  const clear = useMassPay((s) => s.clear);
  const onchain = useOnchain();
  const [paste, setPaste] = useState("");
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const sum = useMemo(() => totals(payees), [payees]);
  const btcReady = unchainedRows(payees);
  const usdcReady = baseRows(payees, "USDC");
  const ethReady = baseRows(payees, "ETH");

  function saveUnchained() {
    if (!btcReady.length) {
      toast.error("Add a Bitcoin address and amount first.");
      return;
    }
    downloadText(
      "IAM-UNCHAINED-mass-pay.csv",
      toUnchainedCsv(payees),
      "text/csv;charset=utf-8",
    );
    toast.success("Unchained CSV ready. Upload it in your vault, then sign.");
  }

  function saveBase(asset: "USDC" | "ETH") {
    const rows = asset === "USDC" ? usdcReady : ethReady;
    if (!rows.length) {
      toast.error(`Add a Base ${asset} row first.`);
      return;
    }
    downloadText(
      `IAM-BASE-${asset}-mass-pay.csv`,
      toBaseCsv(payees, asset),
      "text/csv;charset=utf-8",
    );
    toast.success(`${asset} CSV saved.`);
  }

  function saveHub() {
    downloadText(
      "IAM-hub-roster.json",
      toHubJson(payees),
      "application/json;charset=utf-8",
    );
    toast.success("Hub roster saved.");
  }

  function copyCsv() {
    const csv = toUnchainedCsv(payees);
    void navigator.clipboard.writeText(csv).then(
      () => toast.success("Unchained CSV copied."),
      () => toast.error("Clipboard blocked."),
    );
  }

  function onImport() {
    const rows = parsePastedCsv(paste);
    if (!rows.length) {
      toast.error("No Bitcoin or Base addresses in that paste.");
      return;
    }
    importRows(rows, "append");
    setPaste("");
    toast.success(`Pulled ${rows.length} row${rows.length === 1 ? "" : "s"}.`);
  }

  async function runBaseBatch(asset: "USDC" | "ETH") {
    const rows = asset === "USDC" ? usdcReady : ethReady;
    if (!rows.length) {
      toast.error(`No ${asset} rows ready.`);
      return;
    }
    if (onchain.status !== "ready" || !onchain.address) {
      const ok = await onchain.connect();
      if (!ok) {
        toast.error("Connect Coinbase Wallet on Base first.");
        return;
      }
    }
    setSending(true);
    const notes: string[] = [];
    for (const row of rows) {
      notes.push(`Sending ${row.amount} ${asset} → ${row.evm.slice(0, 8)}…`);
      setLog([...notes]);
      const sent = await useOnchain.getState().sendOnchain({
        to: row.evm,
        amount: String(row.amount),
        asset,
      });
      if (sent) {
        notes[notes.length - 1] = `Sent ${row.amount} ${asset} · ${sent.tx.slice(0, 10)}…`;
      } else {
        notes[notes.length - 1] = `Stopped at ${row.name || row.evm.slice(0, 8)}. Wallet rejected or failed.`;
        setLog([...notes]);
        setSending(false);
        toast.error("Mass pay stopped. Remaining rows were not sent.");
        return;
      }
      setLog([...notes]);
    }
    setSending(false);
    toast.success(`${rows.length} ${asset} payments signed on Base.`);
  }

  return (
    <div className="pt-6 sm:pt-10">
      <p className="text-xs uppercase tracking-[0.22em] text-magenta">
        Melitia Marie Productions
      </p>
      <h1 className="mt-1 text-3xl uppercase text-ivory sm:text-4xl">
        Mass pay
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Roster lives on this device. Unchained takes the Bitcoin CSV — you
        upload it in the vault and sign with your keys. Base USDC / ETH can
        fire from Coinbase Wallet here. This house never holds keys.
      </p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatusCard
          label="GitHub hub"
          value="Live"
          detail="Iamapp source + payouts folder"
          href={HUB_PAYOUTS}
        />
        <StatusCard
          label="Unchained"
          value={btcReady.length ? `${btcReady.length} ready` : "CSV not signed"}
          detail="You sign in the vault. I cannot send your BTC."
          href={UNCHAINED_APP}
        />
        <StatusCard
          label="Base rail"
          value={
            onchain.address
              ? `${onchain.usdc.toFixed(2)} USDC`
              : "Wallet off"
          }
          detail="Connect, then run the USDC batch."
        />
      </dl>

      <section className="mt-8 rounded-lg bg-surface p-4 shadow-foil sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold">
              Roster
            </p>
            <h2 className="mt-1 text-lg uppercase text-ivory">Payees</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => add()}>
              <Plus className="size-3.5" />
              Add
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => clear()}>
              Clear
            </Button>
          </div>
        </div>

        <ul className="mt-5 grid gap-4">
          {payees.length === 0 ? (
            <li className="rounded-md bg-raised p-4 text-sm text-ash">
              Hit Add, or paste a CSV below. Bitcoin rows become the Unchained
              file. 0x rows go to Base.
            </li>
          ) : (
            payees.map((p, i) => (
              <li key={p.id}>
                <PayeeCard
                  index={i + 1}
                  payee={p}
                  onChange={(patch) => update(p.id, patch)}
                  onRemove={() => remove(p.id)}
                />
              </li>
            ))
          )}
        </ul>

        <p className="mt-4 text-xs text-ash">
          {sum.btcPayees} BTC · {sum.btc || 0} · {sum.usdcPayees} USDC ·{" "}
          {sum.usdc || 0} · {sum.ethPayees} ETH · {sum.eth || 0}
        </p>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-surface p-4 shadow-foil sm:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">
            Unchained
          </p>
          <h2 className="mt-1 text-lg uppercase text-ivory">Bitcoin CSV</h2>
          <p className="mt-2 text-sm text-ash">
            Vault → Withdraw → Multiple addresses. Paste this file. Review.
            Sign. Broadcast. Up to 500 destinations, one on-chain spend.
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-void p-3 font-mono text-xs text-ivory">
            {toUnchainedCsv(payees) || "address,amount"}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={saveUnchained}>
              <Download className="size-3.5" />
              Unchained CSV
            </Button>
            <Button type="button" variant="outline" onClick={copyCsv}>
              Copy
            </Button>
            <Button asChild variant="outline">
              <a href={UNCHAINED_APP} target="_blank" rel="noreferrer">
                Open Unchained
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
          <a
            href={UNCHAINED_HELP}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-11 items-center text-xs uppercase tracking-[0.14em] text-ash hover:text-gold"
          >
            Batch spend help
          </a>
        </div>

        <div className="rounded-lg bg-surface p-4 shadow-foil sm:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">
            Hub
          </p>
          <h2 className="mt-1 text-lg uppercase text-ivory">GitHub + Base</h2>
          <p className="mt-2 text-sm text-ash">
            Hub is the Iamapp repo. Download the roster JSON for the house
            record. Base payments sign in Coinbase Wallet, one popup per row.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={saveHub}>
              <Download className="size-3.5" />
              Hub JSON
            </Button>
            <Button type="button" variant="outline" onClick={() => saveBase("USDC")}>
              USDC CSV
            </Button>
            <Button type="button" variant="outline" onClick={() => saveBase("ETH")}>
              ETH CSV
            </Button>
            <Button asChild variant="outline">
              <a href={HUB_PAYOUTS} target="_blank" rel="noreferrer">
                Open hub
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="magenta"
              disabled={sending || !usdcReady.length}
              onClick={() => void runBaseBatch("USDC")}
            >
              <Banknote className="size-3.5" />
              {sending ? "Signing…" : `Send ${usdcReady.length} USDC`}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={sending || !ethReady.length}
              onClick={() => void runBaseBatch("ETH")}
            >
              Send {ethReady.length} ETH
            </Button>
          </div>
          {log.length > 0 ? (
            <ul className="mt-4 space-y-1 font-mono text-xs text-ash">
              {log.map((line, i) => (
                <li key={`${i}-${line}`}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-surface p-4 shadow-foil sm:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Import</p>
        <h2 className="mt-1 text-lg uppercase text-ivory">Paste a list</h2>
        <p className="mt-2 text-sm text-ash">
          Drop a CSV: address, amount, then optional name or memo. Bitcoin
          (bc1 / 1 / 3) goes to Unchained. 0x goes to Base.
        </p>
        <Label htmlFor="paste" className="mt-4">
          CSV
        </Label>
        <Textarea
          id="paste"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={"address,amount\nbc1q…,0.002\n0x…,25"}
        />
        <Button
          type="button"
          className="mt-3"
          variant="outline"
          onClick={onImport}
        >
          <Upload className="size-3.5" />
          Pull into roster
        </Button>
      </section>

      <p className="mt-8 max-w-xl text-xs text-ash">
        I cannot log into Unchained for you. The CSV is the upload. Your
        vault keys are the signature. Demo vault credit in the temple is not
        this rail.{" "}
        <Link to="/productions" className="text-gold hover:underline">
          Back to Productions
        </Link>
        .
      </p>
    </div>
  );
}

function StatusCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold">
        {label}
      </p>
      <p className="mt-2 font-display text-xl uppercase tracking-[0.08em] text-ivory">
        {value}
      </p>
      <p className="mt-1 text-xs text-ash">{detail}</p>
    </>
  );
  const cls =
    "block rounded-lg bg-surface p-4 shadow-foil transition-[box-shadow] duration-(--motion-quick) hover:shadow-foil-hover";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return <div className={cls}>{inner}</div>;
}

function PayeeCard({
  index,
  payee,
  onChange,
  onRemove,
}: {
  index: number;
  payee: Payee;
  onChange: (patch: Partial<Payee>) => void;
  onRemove: () => void;
}) {
  const btcOk = !payee.btc || isBtcAddress(payee.btc);
  const evmOk = !payee.evm || isEthAddress(payee.evm);
  return (
    <article className="rounded-md bg-raised p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <label className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.14em] text-ash">
          <input
            type="checkbox"
            className="size-4 accent-gold"
            checked={payee.included}
            onChange={(e) => onChange({ included: e.target.checked })}
          />
          Row {index}
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex size-11 items-center justify-center rounded-md text-ash hover:text-magenta"
          aria-label="Remove payee"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Name">
          <Input
            value={payee.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Who"
          />
        </Field>
        <Field label="Role">
          <Input
            value={payee.role}
            onChange={(e) => onChange({ role: e.target.value })}
            placeholder="Producer, feature, split"
          />
        </Field>
        <Field label="Amount">
          <Input
            inputMode="decimal"
            value={payee.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            placeholder={payee.asset === "BTC" ? "0.002" : "25"}
          />
        </Field>
        <Field label="Asset">
          <select
            className="h-11 w-full rounded-md bg-void px-3 text-sm text-ivory shadow-[0_0_0_1px_var(--color-border)]"
            value={payee.asset}
            onChange={(e) => onChange({ asset: e.target.value as PayAsset })}
          >
            <option value="BTC">BTC · Unchained</option>
            <option value="USDC">USDC · Base</option>
            <option value="ETH">ETH · Base</option>
          </select>
        </Field>
        <Field label="Bitcoin address">
          <Input
            value={payee.btc}
            onChange={(e) => onChange({ btc: e.target.value.trim() })}
            placeholder="bc1…"
            aria-invalid={!btcOk}
            className={!btcOk ? "shadow-[0_0_0_1px_var(--color-magenta)]" : undefined}
          />
        </Field>
        <Field label="Base address">
          <Input
            value={payee.evm}
            onChange={(e) => onChange({ evm: e.target.value.trim() })}
            placeholder="0x…"
            aria-invalid={!evmOk}
            className={!evmOk ? "shadow-[0_0_0_1px_var(--color-magenta)]" : undefined}
          />
        </Field>
        <Field label="Memo" className="sm:col-span-2 lg:col-span-3">
          <Input
            value={payee.memo}
            onChange={(e) => onChange({ memo: e.target.value })}
            placeholder="Track split, feature, invoice"
          />
        </Field>
      </div>
    </article>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
