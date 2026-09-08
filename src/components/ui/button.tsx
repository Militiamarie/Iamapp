import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans font-medium tracking-wide transition-[transform,box-shadow,background-color,color,opacity] duration-(--motion-quick) ease-(--ease-out) disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        gold: "bg-gold text-void hover:bg-gold-soft",
        magenta: "bg-magenta text-ivory hover:bg-magenta-hot",
        outline:
          "bg-transparent text-gold shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gold)_55%,transparent)] hover:bg-gold/10",
        ghost: "bg-transparent text-ivory/90 hover:bg-raised hover:text-ivory",
        void: "bg-void text-ivory shadow-[0_0_0_1px_var(--color-border)] hover:bg-obsidian",
      },
      size: {
        default: "min-h-11 rounded-md px-4 text-sm",
        sm: "min-h-10 rounded-sm px-3 text-xs",
        lg: "min-h-12 rounded-md px-6 text-sm",
        icon: "size-11 rounded-md p-0",
      },
    },
    defaultVariants: { variant: "gold", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
