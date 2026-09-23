import { CalendarCheck, CalendarRange, FileQuestion, GraduationCap, LifeBuoy } from "lucide-react";

// The questions students ask most, one tap away (chat empty state + expanded input).
export const SHORTCUTS = [
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
