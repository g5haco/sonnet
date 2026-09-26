"use client";
// The landing's floating nav: a "What's included" dropdown (hover, click or keyboard; Escape or a click outside
// closes it) and, on phones, a menu button with every section.
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const INCLUDED = [
  ["#assistant", "Sonnet AI", "Knows your courses, down to the syllabus"],
  ["#features", "Features", "Widgets, calendar, countdowns and more"],
];
const LINKS = [
  ["#how", "How it works"],
  ["#pricing", "Pricing"],
  ["#faq", "FAQ"],
  ["#about", "About"],
];

export function Wordmark() {
  return (
    <span className="font-mono text-lg font-medium tracking-tight">
      sonnet<span className="text-muted-foreground">.</span>
    </span>
  );
}

export function SiteNav({ signUp }: { signUp: string }) {
  const [open, setOpen] = useState(false); // the dropdown
  const [menu, setMenu] = useState(false); // the phone menu
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open && !menu) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), setMenu(false));
    const click = (e: PointerEvent) => !box.current?.contains(e.target as Node) && (setOpen(false), setMenu(false));
    addEventListener("keydown", key);
    addEventListener("pointerdown", click);
    return () => (removeEventListener("keydown", key), removeEventListener("pointerdown", click));
  }, [open, menu]);

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-4">
      <div ref={box} className="mx-auto max-w-4xl">
        <nav
          aria-label="Main"
          className="flex h-14 items-center gap-6 rounded-2xl border border-border bg-background/70 px-5 backdrop-blur-md"
        >
          <Link href="/" aria-label="Sonnet home" className="flex h-11 items-center">
            <Wordmark />
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls="included"
                onClick={() => setOpen(!open)}
                className="flex h-14 items-center gap-1 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
              >
                What&apos;s included
                <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              <div
                id="included"
                hidden={!open}
                className="absolute top-full -left-3 animate-in pt-1 duration-150 fade-in-0 slide-in-from-top-1"
              >
                <div className="flex w-64 flex-col rounded-xl border border-border bg-background/95 p-1.5 shadow-2xl backdrop-blur-md">
                  {INCLUDED.map(([href, name, text]) => (
                    <a
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    >
                      <span className="block text-foreground">{name}</span>
                      <span className="text-xs">{text}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            {LINKS.map(([href, name]) => (
              <a key={href} href={href} className="hover:text-foreground">
                {name}
              </a>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="hidden h-9 items-center rounded-full px-4 text-sm hover:bg-accent sm:flex">
              Sign in
            </Link>
            <Link
              href={signUp}
              className="flex h-11 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 sm:h-9"
            >
              Get started
            </Link>
            <button
              type="button"
              aria-expanded={menu}
              aria-controls="phone-menu"
              aria-label={menu ? "Close menu" : "Open menu"}
              onClick={() => setMenu(!menu)}
              className="-mr-2 grid size-11 place-items-center rounded-full hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:hidden"
            >
              {menu ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </button>
          </div>
        </nav>
        <div
          id="phone-menu"
          hidden={!menu}
          className="mt-2 animate-in rounded-2xl border border-border bg-background/95 p-2 shadow-2xl backdrop-blur-md duration-150 fade-in-0 slide-in-from-top-1 md:hidden"
        >
          {[...INCLUDED.map(([h, n]) => [h, n]), ...LINKS, ["/login", "Sign in"]].map(([href, name]) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenu(false)}
              className="flex h-12 items-center rounded-xl px-4 text-base hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            >
              {name}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
