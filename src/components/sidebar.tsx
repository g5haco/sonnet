"use client";

// Adapted from the Aceternity-style sidebar (sidebar.txt): icon rail that expands on hover.
// Changes: built on `motion` (already installed), expands OVER the page so content never reflows,
// also expands on keyboard focus, real <button>s on mobile, active route highlighted.
import { BookOpen, CalendarDays, House, Menu, MessageCircle, Settings, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GooeyMenu, type CreateKind } from "@/components/gooey-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: House },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/courses", label: "Courses", icon: BookOpen }, // materials live on each course's page
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

const RAIL = 60;
const WIDE = 232;

function NavLink({
  link,
  open,
  active,
  onNavigate,
}: {
  link: (typeof NAV)[number];
  open: boolean;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      // collapsed: the label is hidden, so the link needs its name
      aria-label={open ? undefined : link.label}
      className={cn(
        "group/link flex h-10 items-center gap-3 rounded-xl px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <motion.span
        initial={false}
        animate={{ opacity: open ? 1 : 0, display: open ? "inline-block" : "none" }}
        className="whitespace-pre transition-transform duration-150 group-hover/link:translate-x-0.5"
      >
        {link.label}
      </motion.span>
    </Link>
  );
}

// Settings isn't a page: it opens the floating window over whatever page you're on.
function SettingsButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? undefined : "Settings"}
      className="group/link flex h-10 w-full items-center gap-3 rounded-xl px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Settings className="size-5 shrink-0" aria-hidden="true" />
      <motion.span
        initial={false}
        animate={{ opacity: open ? 1 : 0, display: open ? "inline-block" : "none" }}
        className="whitespace-pre transition-transform duration-150 group-hover/link:translate-x-0.5"
      >
        Settings
      </motion.span>
    </button>
  );
}

export function Sidebar({
  onCreate,
  onAsk,
  onSettings,
}: {
  onCreate: (kind: CreateKind) => void;
  onAsk: () => void;
  onSettings: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [creating, setCreating] = useState(false);
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  // The Create droplets pop out to the right of the rail, so the rail stays collapsed while they're open.
  const open = hovered && !creating;

  return (
    <>
      {/* Desktop: reserves the rail's width; the panel itself overlays the page when expanded. */}
      <div className="relative hidden shrink-0 md:block" style={{ width: RAIL }}>
        <motion.nav
          aria-label="Main"
          initial={false}
          animate={{ width: open ? WIDE : RAIL }}
          transition={{ type: "spring", stiffness: 420, damping: 42 }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHovered(false)}
          className="fixed inset-y-0 left-0 z-40 flex flex-col gap-6 border-r border-border bg-sidebar px-2.5 py-4"
        >
          <Link
            href="/"
            aria-label="Sonnet home"
            className="flex h-10 items-center rounded-xl px-2.5 font-mono text-lg font-medium tracking-tight focus-visible:ring-2 focus-visible:ring-ring"
          >
            s
            <motion.span initial={false} animate={{ opacity: open ? 1 : 0, display: open ? "inline" : "none" }}>
              onnet
            </motion.span>
            <span className="text-brand">.</span>
          </Link>

          <GooeyMenu
            direction="right"
            open={creating}
            onOpenChange={setCreating}
            onPick={onCreate}
            // chat sits beside the "+" while the rail is open, and tucks into it otherwise
            companion={{ label: "Ask the assistant (Ctrl+K)", icon: MessageCircle, onClick: onAsk, show: open }}
          />

          <div className="flex flex-col gap-1">
            {NAV.map((l) => (
              <NavLink key={l.href} link={l} open={open} active={isActive(l.href)} />
            ))}
          </div>
          <div className="mt-auto">
            <SettingsButton open={open} onClick={onSettings} />
          </div>
        </motion.nav>
      </div>

      {/* Phones: a top bar with the menu and Create; the menu opens full screen. */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-2 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setMenu(true)}
          aria-label="Open menu"
          className="grid size-11 place-items-center rounded-full focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="font-mono text-lg font-medium tracking-tight">
          sonnet<span className="text-brand">.</span>
        </Link>
        <div className="ml-auto">
          <GooeyMenu direction="down" open={creating} onOpenChange={setCreating} onPick={onCreate} />
        </div>
      </div>
      <AnimatePresence>
        {menu && (
          <motion.nav
            aria-label="Main"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col gap-1 bg-background p-4 md:hidden"
          >
            <button
              type="button"
              onClick={() => setMenu(false)}
              aria-label="Close menu"
              className="mb-4 grid size-11 place-items-center self-end rounded-full focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" />
            </button>
            {NAV.map((l) => (
              <NavLink key={l.href} link={l} open active={isActive(l.href)} onNavigate={() => setMenu(false)} />
            ))}
            <SettingsButton
              open
              onClick={() => {
                setMenu(false);
                onSettings();
              }}
            />
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
