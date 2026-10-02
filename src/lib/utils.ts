export { cn } from "cn"

// Rendered on screen? (offsetParent is always null inside position: fixed, so it can't answer this.)
export const isShown = (el: Element | null | undefined) => !!el && el.getClientRects().length > 0

// The "s" of a count: `item${plural(n)}`.
export const plural = (n: number) => (n === 1 ? "" : "s")
