import {
  Award,
  BookOpenCheck,
  CalendarClock,
  ListChecks,
  CalendarCheck,
  CalendarRange,
  FileQuestion,
  GraduationCap,
  Layers,
  LifeBuoy,
  MessageCircleQuestion,
} from "lucide-react";
import type { Item } from "@/lib/progress";

// `focus` = the course code the chat switches to first, so the assistant reads that course's materials.
export type Shortcut = { label: string; prompt: string; icon: typeof CalendarCheck; focus?: string };

// The questions students ask most, one tap away (chat empty state + expanded input).
export const SHORTCUTS: Shortcut[] = [
  { label: "What's due this week?", prompt: "What's due this week, in order of urgency?", icon: CalendarCheck },
  { label: "Plan my week", prompt: "Plan my week: when should I work on each thing that's due?", icon: CalendarRange },
  { label: "Help me study", prompt: "Help me study for my next exam. What should I focus on, and when?", icon: GraduationCap },
  { label: "Catch me up", prompt: "I'm behind. What's overdue, and what should I do first?", icon: LifeBuoy },
  {
    label: "Explain an assignment",
    prompt: "Explain one of my assignments: what it's really asking for and how to start.",
    icon: FileQuestion,
  },
];

// Shortcuts for where the student is: a course (the page they're on, or the chat's focus) gets its exams'
// study guides first, then quiz and flashcards, then the everyday questions.
// An "Ask about this" chat starts with questions about that assignment (the chip already says which one).
export const ABOUT_ITEM: Shortcut[] = [
  { label: "What do I need to do?", prompt: "What do I need to do for this assignment? Walk me through it.", icon: ListChecks },
  {
    label: "Plan to finish on time",
    prompt: "Make a plan to finish this assignment by the due date, around my classes.",
    icon: CalendarClock,
  },
  { label: "What's this worth?", prompt: "What's this assignment worth, and how much does it matter for my grade?", icon: Award },
];

export function shortcutsFor(course: string | undefined, items: Item[], now: number, item?: Item | null): Shortcut[] {
  if (item) return ABOUT_ITEM;
  if (!course) return SHORTCUTS;
  const exams = items
    .filter((i) => i.course === course && i.kind === "exam" && !i.doneAt)
    .filter((i) => Date.parse(i.due) > now && Date.parse(i.due) < now + 30 * 864e5)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 2);
  return [
    ...exams.map((e) => ({
      label: `Study guide: ${e.title}`,
      prompt: `Make a study guide for ${course} ${e.title} (${new Date(e.due).toDateString()}) from my course materials: the key topics and what to know about each, likely exam questions, and a day-by-day plan until then.`,
      icon: BookOpenCheck,
      focus: course,
    })),
    SHORTCUTS[0],
    {
      label: `Quiz me on ${course}`,
      prompt: `Quiz me on ${course}: one question at a time, wait for my answer, then tell me if I'm right and why.`,
      icon: MessageCircleQuestion,
      focus: course,
    },
    { label: `Flashcards for ${course}`, prompt: `Make flashcards for the key ideas in ${course}.`, icon: Layers, focus: course },
    ...SHORTCUTS.slice(1),
  ];
}
