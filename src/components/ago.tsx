import { useEffect, useState } from "react";
import { formatAgo } from "@/lib/format";

export function Ago({ at }: { at: number }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(formatAgo(at));
  }, [at]);
  return <span suppressHydrationWarning>{label || formatAgo(at)}</span>;
}
