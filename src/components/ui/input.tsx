import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full min-h-11 rounded-md bg-void px-3 text-sm text-ivory shadow-[0_0_0_1px_var(--color-border)] placeholder:text-ash/70 transition-[box-shadow] duration-(--motion-quick) ease-(--ease-out) focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-gold)]";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, className)} suppressHydrationWarning {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(field, "min-h-28 resize-y py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block font-sans text-xs font-medium uppercase tracking-[0.16em] text-ash",
        className,
      )}
      {...props}
    />
  );
}
