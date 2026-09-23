"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { clamp, mix, stillness, useSpring } from "@/lib/spring";

/* Tilt card, from Bencho (MIT, bencho.dev/licence). Changes for Sonnet: the face is children (a course
   card) instead of a photograph, the whole card is a link, and it sizes to its grid column at a fixed
   13:16 ratio instead of a fixed 260x320. */

/* ══ Tilt ═════════════════════════════════════════════════
   A card that gives under the pointer.

   IT SINKS, IT DOES NOT LIFT. Every tilt card on the internet
   rotates TOWARD the cursor: the corner you are nearest rises
   to meet you and the card reads as a slab of glass catching
   the light. This one does the opposite — the point you are
   over goes AWAY, and the far side comes up. The difference
   is one minus sign and it is the whole component: a surface
   that rises to your finger is being displayed to you, and a
   surface that gives under it is being touched.

   Which means the sign is not a detail to get right by
   fiddling. Cursor at the top → the top edge has to go back,
   which is a POSITIVE rotateX; cursor at the right → the
   right edge goes back, which is a positive rotateY. Hence
   `rx = -ny` and `ry = +nx`, the negation of the usual pair.

   THE ROTATION ALONE IS NOT ENOUGH. A rotation about the
   centre is symmetric — the near side down, the far side up
   by the same amount — and on its own it reads as a card
   pivoting, not as one being pressed. What makes it a press
   is that the darkest point tracks the pointer: a depression
   catches shadow at its deepest, and the rim opposite catches
   light. Those two gradients are doing at least as much of
   the work as the transform is, and neither would convince on
   its own.

   ONE PAIR OF NUMBERS IS THE STATE. Two springs hold where
   the pointer is, normalised to -1..1, and the rotation, both
   gradients and the shadow are all read off them. Nothing
   here has a transition of its own. */

/* ── how deep the room is ──────────────────────────────────
   The one number that decides whether this reads as a card
   turning or as a poster being sheared. Perspective is the
   distance from the viewer to the screen, so a small number
   is a face close to the glass: the near corner grows, the
   far corner shrinks, and ten degrees looks like thirty.

   800 against a ~320px card is about two and a half card
   heights back — far enough that the foreshortening is a
   suggestion rather than a fisheye, close enough that the
   corners are visibly different sizes. */
const DEPTH = 800;

/* how far the whole card retreats while it is being touched.
   Small on purpose — this is the difference between a card
   that tips and a card that is pushed, and at anything past
   about twenty it stops being a press and becomes a zoom. */
const SINK = 14;

const CORNER = 20;
const TILT = 10;
const SHADE = 60;

export function TiltCard({
  href,
  label,
  children,
  /* the most either axis turns, in degrees */
  tilt = TILT,
  corner = CORNER,
  /* how dark the dent gets, 0..100 */
  shade = SHADE,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  tilt?: number;
  corner?: number;
  shade?: number;
}) {
  const skin = useRef<HTMLDivElement | null>(null);
  const [at, setAt] = useState({ x: 0, y: 0 });
  const [on, setOn] = useState(false);
  const still = stillness();

  /* ── the state, and there is only this ───────────────────
     Where the pointer is, as -1..1 on each axis, sprung. The
     spring is on the POSITION rather than on the rotation, so
     the gradients and the transform can never disagree about
     where the finger is — they are three readings of one
     number instead of three things being animated towards
     the same place.

     Sprung rather than tracked one-to-one because a card with
     no weight follows the cursor exactly and reads as a
     texture pinned to the mouse. The lag is what gives it
     mass, and the settle on the way out is the only reason
     leaving the card feels like anything at all. */
  const sx = useSpring(on ? at.x : 0, 50, still);
  const sy = useSpring(on ? at.y : 0, 50, still);
  /* one more for how much of any of this applies, so the
     shadow and the sheen fade rather than cutting */
  const lit = useSpring(on ? 1 : 0, 50, still);

  const max = clamp(tilt, 0, 20);
  const rx = -sy * max;
  const ry = sx * max;

  /* the pointer in the card's own terms, as a PERCENTAGE — a
     gradient placed in pixels would land somewhere else at
     every card size */
  const px = ((sx + 1) / 2) * 100;
  const py = ((sy + 1) / 2) * 100;

  const dark = (clamp(shade, 0, 100) / 100) * 0.55 * lit;
  const rim = (clamp(shade, 0, 100) / 100) * 0.34 * lit;

  const track = (e: React.PointerEvent) => {
    const el = skin.current;
    if (!el) return;
    /* measured from the FRAME, which never moves. Reading the
       card instead would be asking a rotating object where it
       is, and near the edges it has already turned away from
       the pointer that is asking. */
    const r = el.getBoundingClientRect();
    setAt({
      x: clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1),
      y: clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1),
    });
    setOn(true);
  };

  return (
    <div
      className="tlt"
      ref={skin}
      style={{ aspectRatio: "13 / 16", perspective: DEPTH }}
      /* pointer, not mouse: the same handler carries a finger
         dragged across the card, so a phone gets the effect
         while it is being touched rather than getting nothing
         at all. */
      onPointerMove={track}
      /* `out` with a containment test, NOT `leave`: null
         relatedTarget (a pointer leaving the window) counts as
         outside, which React would not synthesise a leave for. */
      onPointerOut={(e) => {
        const el = skin.current;
        const to = e.relatedTarget as Node | null;
        if (!el || !to || !el.contains(to)) setOn(false);
      }}
      /* a touch taken over by a scroll never reports leaving */
      onPointerCancel={() => setOn(false)}
    >
      <Link
        href={href}
        aria-label={label}
        className="tlt-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        style={{
          borderRadius: clamp(corner, 0, 40),
          /* translateZ FIRST, so the retreat is measured in
             the room's axes rather than in the card's own —
             after a rotation, the card's z points somewhere
             off to the side and "back" stops meaning back. */
          transform: `translateZ(${-SINK * lit}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
          /* ── the shadow TIGHTENS ────────────────────────
             A thing pressed into a surface has less air under
             it, so the gap closes and the shadow draws in.
             Growing it on hover is the reflex — it is what a
             card that LIFTS would do — and it fights every
             other cue here. */
          boxShadow: `0 ${mix(20, 9, lit)}px ${mix(44, 24, lit)}px -8px rgba(0, 0, 0, ${mix(0.22, 0.15, lit)})`,
        }}
      >
        {children}
        {/* ── the dent, and the rim opposite it ───────────
            The shadow pools where the surface is deepest,
            which is under the pointer, and the light catches
            the far edge that has risen — so the two are
            placed at mirrored points and neither is centred
            on anything. This is the layer that makes the
            transform read as a press. */}
        <span
          className="tlt-sheen"
          aria-hidden="true"
          style={{
            backgroundImage: `radial-gradient(42% 34% at ${px}% ${py}%, rgba(9, 14, 28, ${dark}) 0%, rgba(9, 14, 28, 0) 100%), radial-gradient(52% 42% at ${
              100 - px
            }% ${100 - py}%, rgba(255, 255, 255, ${rim}) 0%, rgba(255, 255, 255, 0) 100%)`,
          }}
        />
      </Link>
    </div>
  );
}
