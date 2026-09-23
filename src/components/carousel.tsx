"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { clamp, mix, stillness, useSpring } from "@/lib/spring";

/* Carousel, from Bencho (MIT, bencho.dev/licence). Changes for Sonnet: the cards are course cards (links)
   instead of photographs, the count is however many courses there are, and the stage scales down to fit
   its container on narrow screens. A tap opens the card under it; a drag only turns the ring. */

export type Slide = { key: string; href: string; label: string; face: React.ReactNode };

/* ══ Carousel ═════════════════════════════════════════════
   Cards on a turntable that drift at rest, give under the
   pointer, and can be swiped round.

   NOTHING EVER LEAVES THE FRAME, and that is the whole
   arrangement. A row has to decide what happens to a card when
   it runs out of block. A ring does not ask it. The cards go
   ROUND: out to one side, back and small, round to the other
   side, forward again.

   IT IS THEREFORE ENDLESS. A ring has no first and last card,
   so the swipe never runs out and never rubber-bands.

   THE ANGLE IS NOT TAKEN MODULO ANYTHING. `turn` counts up
   and down without limit and the angle is `(i - turn) * step`.
   Wrapping it to 0..360 would send a card the long way round
   the moment it crossed the seam.

   THREE MOTIONS, THREE ELEMENTS, ONE TRANSFORM EACH. The slot
   carries where the card is on the ring, the floater carries
   the drift, the card carries the tilt. They are nested rather
   than composed into one string because they are owned by
   three different things — the drag, a CSS animation and a
   pair of springs. */

const CARD_W = 206;
const CARD_H = 292;
/* the stage: the default ring plus a little air. Fixed, and scaled
   as a whole when the container is narrower. */
const STAGE_W = 476;
const STAGE_H = 340;
const ORBIT = 138;
/* how much smaller the back of the ring is, as a percentage of
   the way to half size: 100 puts the card at the back at 0.5 */
const DEPTH = 100;
const CORNER = 18;
const FLOAT = 15;
const SINK = 50;

/* ── how far back the ring leans ───────────────────────────
   A card at the back sits this much higher than one at the
   front. Scale alone says smaller, which the eye can read as
   further away OR as literally smaller; a card that also rides
   UP as it recedes is unmistakably going back. At 38 the card
   at the very back clears the front one by ten pixels, and
   seeing something behind is what tells you the ring goes round. */
const LEAN = 38;

/* how many px of drag turn the ring one position */
const PULL = 140;
/* how far ahead of the release the throw looks, in ms of travel:
   what makes a short fast flick move a card */
const TOSS = 150;
/* and how many it may skip. Past two the ring blurs and you have
   lost your place on it. */
const MOST = 2;
const SETTLE_MS = 620;

/* every card sits at its own angle: numbers that are not a
   pattern, so the ring reads as cards somebody put down */
const ANGLE = [-4.2, 2.6, -1.4, 3.8, 1.7, -2.9, 0.9, -3.3];
/* the drift's periods, deliberately awkward so no two cards are
   ever doing the same thing */
const PERIOD = [4.7, 5.9, 6.7, 5.3, 7.1, 6.1];

type Spot = { x: number; y: number; s: number; z: number };

/* ── where a card sits, given where the ring is ────────────
   ONE function, read by the first paint and by the drag both.
   `f` is 1 at the front and 0 at the back, and it drives the
   size, the lean and the paint order together. */
const spotOf = (i: number, n: number, turn: number, orbit: number): Spot => {
  const th = (i - turn) * ((Math.PI * 2) / n);
  const f = (Math.cos(th) + 1) / 2;
  return {
    x: Math.sin(th) * orbit,
    y: -(1 - f) * LEAN,
    s: mix(1 - DEPTH / 200, 1, f),
    /* paint order is a z-index, by hand: everything here is 2D, so
       nothing sorts itself and `f` already knows which is nearer */
    z: Math.round(f * 100),
  };
};

const write = (el: HTMLElement, sp: Spot, angle: number) => {
  /* NO OPACITY IS WRITTEN HERE: fading with distance made the whole
     block pulse on a gesture that should only move things round */
  el.style.transform = `translate(-50%, -50%) translate(${sp.x.toFixed(2)}px, ${sp.y.toFixed(2)}px) rotate(${angle}deg) scale(${sp.s.toFixed(4)})`;
  el.style.zIndex = String(sp.z);
};

const out = (t: number) => 1 - (1 - t) ** 4;

export function Carousel({
  slides,
  label = "Carousel",
  /* how far out to the sides the ring reaches, and the stage width that holds it. A small ring
     (e.g. 64 / 320 in a side column) keeps the cards big and lets the others peek from behind. */
  orbit = ORBIT,
  width = STAGE_W,
}: {
  slides: Slide[];
  label?: string;
  orbit?: number;
  width?: number;
}) {
  const still = stillness();
  const n = slides.length;
  const router = useRouter();
  const frame = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1); // stage scale, <= 1 on narrow containers
  const slots = useRef<(HTMLDivElement | null)[]>([]);
  /* ── where the ring is, and it is a REF ──────────────────
     A continuous position in card-steps. It changes every frame
     of a drag, which is exactly the value that must not be state. */
  const turn = useRef(0);
  const raf = useRef(0);
  const drag = useRef<{
    x0: number;
    t0: number;
    last: number;
    t: number;
    vx: number;
    moved: boolean;
    href?: string;
  } | null>(null);
  const [held, setHeld] = useState(false);

  const paint = useCallback(() => {
    slots.current.forEach((el, i) => el && write(el, spotOf(i, n, turn.current, orbit), ANGLE[i % ANGLE.length]));
  }, [n, orbit]);
  useLayoutEffect(paint, [paint]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useLayoutEffect(() => {
    const el = frame.current!;
    const fit = () => setK(Math.min(1, el.clientWidth / width));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  /* ── the settle ──────────────────────────────────────────
     Quart-out from wherever the ring currently is to a whole
     position. It reads its start from the live value, so a second
     swipe during one turns the ring further instead of snapping back. */
  const glide = (to: number) => {
    cancelAnimationFrame(raf.current);
    const from = turn.current;
    if (still || from === to) {
      turn.current = to;
      paint();
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / SETTLE_MS);
      turn.current = mix(from, to, out(p));
      paint();
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const down = (e: React.PointerEvent) => {
    cancelAnimationFrame(raf.current);
    drag.current = {
      x0: e.clientX,
      t0: turn.current,
      last: e.clientX,
      t: e.timeStamp,
      vx: 0,
      moved: false,
      href: (e.target as HTMLElement).closest<HTMLElement>("[data-href]")?.dataset.href,
    };
    setHeld(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* not a live pointer */
    }
  };

  const move = (e: React.PointerEvent) => {
    const g = drag.current;
    if (!g) return;
    const dx = e.clientX - g.x0;
    if (!g.moved && Math.abs(dx) > 3) g.moved = true;
    /* px per ms, smoothed against the previous reading so one jittery
       frame cannot fake a flick — and measured from the LAST position,
       because the speed at release is what says how far it meant to go */
    const dt = Math.max(1, e.timeStamp - g.t);
    g.vx = (g.vx + (e.clientX - g.last) / dt) / 2;
    g.last = e.clientX;
    g.t = e.timeStamp;
    /* no rubber band, because there is no end */
    turn.current = g.t0 - dx / (PULL * k);
    paint();
  };

  const up = () => {
    const g = drag.current;
    if (!g) return;
    drag.current = null;
    setHeld(false);
    // A tap (no drag) opens the card under it. Link clicks from the pointer are swallowed below,
    // because pointer capture on the ring decides what the gesture was.
    if (!g.moved) return g.href && router.push(g.href);
    /* where it would come to rest if it kept going, capped so a
       hard flick cannot spin the ring past where you can follow it */
    const carry = clamp((-g.vx * TOSS) / (PULL * k), -MOST, MOST);
    glide(Math.round(turn.current + carry));
  };

  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target === e.currentTarget) {
      const front = ((Math.round(turn.current) % n) + n) % n;
      return router.push(slides[front].href);
    }
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    glide(Math.round(turn.current) + d);
  };

  return (
    <div ref={frame} className="relative w-full" style={{ height: STAGE_H * k }}>
      <div
        className="car absolute top-0 left-1/2 origin-top"
        style={{ width, height: STAGE_H, transform: `translateX(-50%) scale(${k})` }}
      >
        <div
          className="car-track"
          data-held={held}
          role="group"
          aria-label={`${label}. Arrow keys turn it, Enter opens the front card.`}
          aria-roledescription="carousel"
          tabIndex={0}
          onKeyDown={key}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.key}
              ref={(el) => {
                slots.current[i] = el;
              }}
              className="car-slot"
              style={{ width: CARD_W, height: CARD_H }}
            >
              {/* ── the drift ─────────────────────────────────
                  Its own element, so the keyframes own this
                  transform outright and neither the ring nor the
                  tilt ever writes it. */}
              <div
                className="car-float"
                style={{
                  animationDuration: `${PERIOD[i % PERIOD.length]}s`,
                  ["--lift" as string]: `${((FLOAT / 100) * 16).toFixed(2)}px`,
                  ["--sway" as string]: `${((FLOAT / 100) * 1.4).toFixed(2)}deg`,
                }}
              >
                {/* a card under a finger that is turning the ring is
                    not being pressed, it is being carried */}
                <Card slide={slide} off={held || still} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── one card, and the press is its own ───────────────────
   A component per card because the tilt is a pair of springs and
   a hook cannot be called n times from the parent. It costs
   nothing at rest: a spring at its target runs no loop at all. */
function Card({ slide, off }: { slide: Slide; off: boolean }) {
  const skin = useRef<HTMLAnchorElement | null>(null);
  const [pt, setPt] = useState({ x: 0, y: 0 });
  const [on, setOn] = useState(false);
  const still = stillness();

  const live = on && !off;
  const sx = useSpring(live ? pt.x : 0, 50, still);
  const sy = useSpring(live ? pt.y : 0, 50, still);
  const lit = useSpring(live ? 1 : 0, 50, still);

  const deep = SINK / 100;
  const max = deep * 13;
  /* IT SINKS, IT DOES NOT LIFT — the tilt card's rule. The point
     you are over goes AWAY and the far side comes up. */
  const rx = -sy * max;
  const ry = sx * max;
  const px = ((sx + 1) / 2) * 100;
  const py = ((sy + 1) / 2) * 100;
  const dark = deep * 0.5 * lit;
  /* the rim is a hint, not a highlight */
  const rim = deep * 0.16 * lit;

  const track = (e: React.PointerEvent) => {
    const el = skin.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    setPt({
      x: clamp(((e.clientX - b.left) / b.width) * 2 - 1, -1, 1),
      y: clamp(((e.clientY - b.top) / b.height) * 2 - 1, -1, 1),
    });
    setOn(true);
  };

  return (
    <Link
      ref={skin}
      href={slide.href}
      data-href={slide.href}
      aria-label={slide.label}
      draggable={false}
      className="car-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
      // Pointer taps are handled by the ring (so a drag never opens a card); keyboard Enter still works.
      onClick={(e) => e.detail > 0 && e.preventDefault()}
      onPointerMove={track}
      onPointerOut={(e) => {
        const el = skin.current;
        const to = e.relatedTarget as Node | null;
        if (!el || !to || !el.contains(to)) setOn(false);
      }}
      onPointerCancel={() => setOn(false)}
      style={{
        borderRadius: CORNER,
        /* translateZ FIRST, so the retreat is measured in the room's
           axes rather than in the card's own */
        transform: `translateZ(${(-10 * deep * lit).toFixed(2)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`,
        /* ONE SHADOW, AND IT DOES NOT MOVE: on several cards, shadows
           resizing as the pointer crossed them read as the ring
           flickering rather than one card being touched */
        boxShadow: "0 12px 28px -10px rgba(0, 0, 0, 0.28)",
      }}
    >
      {slide.face}
      {/* the dent, and the rim opposite it */}
      <span
        className="car-sheen"
        aria-hidden="true"
        style={{
          borderRadius: CORNER,
          backgroundImage: `radial-gradient(44% 36% at ${px.toFixed(1)}% ${py.toFixed(1)}%, rgba(9, 14, 28, ${dark.toFixed(3)}) 0%, rgba(9, 14, 28, 0) 100%), radial-gradient(54% 44% at ${(100 - px).toFixed(1)}% ${(100 - py).toFixed(1)}%, rgba(255, 255, 255, ${rim.toFixed(3)}) 0%, rgba(255, 255, 255, 0) 100%)`,
        }}
      />
    </Link>
  );
}
