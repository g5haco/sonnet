"use client";

// Adapted from the Aceternity-style sidebar (sidebar.txt): icon rail that expands on hover.
// Changes: built on `motion` (already installed), expands OVER the page so content never reflows,
// also expands on keyboard focus, real <button>s on mobile, active route highlighted.
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  FilePlus2,
  FileUp,
  House,
  Menu,
  MessageCircle,
  PanelRightOpen,
  Plus,
  RefreshCw,
  Settings,
  Timer,
  X,
} from "lucide-react";
import { AnimatePresence, motion, Reorder } from "motion/react";
import { toast } from "sonner";
import { useSidebarActions } from "@/components/app-shell";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ACTIONS, type ActionId } from "@/lib/home";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GooeyMenu, type CreateKind } from "@/components/gooey-menu";
import { cn } from "@/lib/utils";
import { FocusButton } from "@/components/focus-timer";

const NAV = [
  { href: "/", label: "Home", icon: House },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/courses", label: "Courses", icon: BookOpen }, // materials live on each course's page
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

// Settings and Sync aren't pages: they open floating windows over whatever page you're on.
function WindowButton({
  open,
  onClick,
  icon: Icon,
  label,
  alert,
}: {
  open: boolean;
  onClick: () => void;
  icon: typeof Settings;
  label: string;
  alert?: string; // a red dot plus this text for screen readers, e.g. "sync failed"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? undefined : alert ? `${label}, ${alert}` : label}
      className="group/link flex h-10 w-full items-center gap-3 rounded-xl px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="relative shrink-0">
        <Icon className="size-5" aria-hidden="true" />
        {alert && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive" />}
      </span>
      <motion.span
        initial={false}
        animate={{ opacity: open ? 1 : 0, display: open ? "inline-block" : "none" }}
        className="whitespace-pre transition-transform duration-150 group-hover/link:translate-x-0.5"
      >
        {label}
        {alert && <span className="sr-only">, {alert}</span>}
      </motion.span>
    </button>
  );
}

// Chat's one entry point sits with the "+": beside it on the open rail and the phone bar, under it on the
// collapsed rail. (Ctrl+K and the Ask button still open the side panel.)
function ChatLink({ active, onNavigate }: { active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href="/chat"
      onClick={onNavigate}
      aria-label="Chat"
      title="Chat"
      aria-current={active ? "page" : undefined}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full shadow-[0_6px_18px_rgb(0_0_0/0.18)] transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent",
      )}
    >
      <MessageCircle className="size-5" aria-hidden="true" />
    </Link>
  );
}

const round =
  "grid size-10 shrink-0 place-items-center rounded-full bg-secondary shadow-[0_6px_18px_rgb(0_0_0/0.18)] transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring";

// Every action the sidebar can hold. Create, Chat and Timer are their own components; the rest are plain buttons.
const ACTION: Record<ActionId, { label: string; icon: typeof Plus }> = {
  create: { label: "Create", icon: Plus },
  chat: { label: "Chat", icon: MessageCircle },
  timer: { label: "Focus timer", icon: Timer },
  ask: { label: "Ask the assistant", icon: PanelRightOpen },
  sync: { label: "Sync", icon: RefreshCw },
  upload: { label: "Upload materials", icon: FileUp },
  assignment: { label: "New assignment", icon: FilePlus2 },
  exam: { label: "New exam", icon: CalendarClock },
};

// Where a removed button's job still lives, said once when it's removed.
const STILL = { chat: "Chat is still one Ctrl+K away.", timer: "The timer is still on Alt+T and Home's Focus timer widget." };

export function Sidebar({
  onAsk,
  onCreate,
  onSettings,
  onSync,
  syncFailed,
}: {
  onAsk: () => void;
  onCreate: (kind: CreateKind) => void;
  onSettings: () => void;
  onSync: () => void;
  syncFailed: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [creating, setCreating] = useState(false);
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const { actions, setActions, editing } = useSidebarActions();
  // The Create droplets pop out to the right of the rail, so the rail stays collapsed while they're open;
  // editing the actions keeps it collapsed too.
  const open = hovered && !creating && !editing;
  const onChat = path === "/chat";
  const alert = syncFailed ? "sync failed" : undefined;

  const action = (id: ActionId, direction: "right" | "down") => {
    if (id === "create") return <GooeyMenu direction={direction} open={creating} onOpenChange={setCreating} onPick={onCreate} />;
    if (id === "chat") return <ChatLink active={onChat} />;
    if (id === "timer") return <FocusButton />;
    const run = { ask: onAsk, sync: onSync, upload: () => onCreate("upload"), assignment: () => onCreate("assignment"), exam: () => onCreate("exam") }[id];
    const Icon = ACTION[id].icon;
    return (
      <button type="button" onClick={run} aria-label={ACTION[id].label} title={ACTION[id].label} className={round}>
        <Icon className="size-5" aria-hidden="true" />
      </button>
    );
  };
  const missing = ACTIONS.filter((a) => !actions.includes(a));

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

          {/* The customizable actions: stacked when collapsed, side by side (wrapping) when open. In Home's edit
              mode they drag to reorder, × removes one, and the dashed + adds one back. */}
          {editing ? (
            <Reorder.Group axis="y" values={actions} onReorder={setActions} className="flex flex-col gap-1.5">
              {actions.map((id) => (
                <Reorder.Item
                  key={id}
                  value={id}
                  tabIndex={0}
                  aria-label={`${ACTION[id].label}: drag, or use the up and down arrow keys, to reorder`}
                  onKeyDown={(e) => {
                    const d = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
                    const i = actions.indexOf(id);
                    if (!d || e.target !== e.currentTarget || i + d < 0 || i + d >= actions.length) return;
                    e.preventDefault();
                    const next = [...actions];
                    [next[i], next[i + d]] = [next[i + d], next[i]];
                    setActions(next);
                  }}
                  className="relative size-10 cursor-grab rounded-full outline-1 outline-offset-2 outline-foreground/30 outline-dashed focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                >
                  <div inert className="opacity-60">
                    {action(id, "right")}
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${ACTION[id].label}`}
                    onClick={() => {
                      setActions(actions.filter((a) => a !== id));
                      if (id === "chat" || id === "timer") toast(STILL[id]);
                    }}
                    className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-foreground text-background focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Reorder.Item>
              ))}
              {missing.length > 0 && (
                <li>
                <Popover>
                  <PopoverTrigger
                    aria-label="Add a sidebar button"
                    className="grid size-10 place-items-center rounded-full border border-dashed border-foreground/30 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus className="size-5" aria-hidden="true" />
                  </PopoverTrigger>
                  <PopoverContent side="right" align="start" className="w-56 gap-0.5 rounded-xl p-1.5">
                    {missing.map((id) => {
                      const Icon = ACTION[id].icon;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActions([...actions, id])}
                          className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                          {ACTION[id].label}
                        </button>
                      );
                    })}
                  </PopoverContent>
                </Popover>
                </li>
              )}
            </Reorder.Group>
          ) : (
            <div className={cn("flex items-start", open ? "flex-row flex-wrap gap-2" : "flex-col gap-1.5")}>
              {actions.map((id) => (
                <motion.div key={id} layout transition={{ type: "spring", stiffness: 420, damping: 42 }}>
                  {action(id, "right")}
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1">
            {NAV.map((l) => (
              <NavLink key={l.href} link={l} open={open} active={isActive(l.href)} />
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-1">
            <WindowButton open={open} onClick={onSync} icon={RefreshCw} label="Sync" alert={alert} />
            <WindowButton open={open} onClick={onSettings} icon={Settings} label="Settings" />
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
        <div className="ml-auto flex items-center gap-2">
          {actions.map((id) => (
            <div key={id}>{action(id, "down")}</div>
          ))}
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
            <div className="mt-auto flex flex-col gap-1">
              <WindowButton
                open
                icon={RefreshCw}
                label="Sync"
                alert={alert}
                onClick={() => {
                  setMenu(false);
                  onSync();
                }}
              />
              <WindowButton
                open
                icon={Settings}
                label="Settings"
                onClick={() => {
                  setMenu(false);
                  onSettings();
                }}
              />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
