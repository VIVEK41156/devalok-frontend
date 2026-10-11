import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

/**
 * Wraps every word of a heading in a masked span so RevealScope's
 * data-reveal="words" can slide them up one by one. Works on mixed content
 * (e.g. text + <em>). Elements using background-clip text (.text-gold-sheen)
 * are kept whole, because transformed children would lose the gradient.
 */
export default function SplitWords({ children }: { children: ReactNode }) {
  return <>{split(children, "w")}</>;
}

function mask(content: ReactNode, key: string) {
  return (
    <span key={key} className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
      <span data-word className="inline-block will-change-transform">
        {content}
      </span>
    </span>
  );
}

function split(node: ReactNode, prefix: string): ReactNode {
  if (typeof node === "string") {
    return node.split(/(\s+)/).map((part, i) => (part.trim() === "" ? part : mask(part, `${prefix}-${i}`)));
  }
  if (Array.isArray(node)) return Children.map(node, (child, i) => split(child, `${prefix}-${i}`));
  if (isValidElement(node)) {
    const el = node as ReactElement<{ className?: string; children?: ReactNode }>;
    if (el.props.className?.includes("text-gold-sheen")) return mask(el, `${prefix}-sheen`);
    if (el.props.children === undefined) return el;
    return cloneElement(el, undefined, split(el.props.children, `${prefix}-c`));
  }
  return node;
}
