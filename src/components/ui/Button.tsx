import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  href: string;
  children: ReactNode;
  variant?: "gold" | "outline-light" | "outline-dark" | "text";
  className?: string;
}

const styles = {
  gold: "bg-gold text-plum-deep hover:bg-gold-soft",
  "outline-light": "border border-ivory/40 text-ivory hover:border-gold hover:text-gold-soft",
  "outline-dark": "border border-plum/30 text-plum hover:border-gold hover:bg-gold hover:text-plum-deep",
  text: "px-0! text-gold-deep",
};

export default function Button({ href, children, variant = "gold", className = "" }: Props) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-3 px-7 py-4 text-xs font-semibold uppercase tracking-[0.22em] transition-colors duration-300 ${styles[variant]} ${className}`}
    >
      {children}
      <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}
