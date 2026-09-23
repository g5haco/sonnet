import { ComingSoon } from "@/components/coming-soon";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Calendar · Sonnet" };

export default async function Calendar() {
  await requireUser();
  return (
    <ComingSoon
      title="Calendar"
      phase={4}
      points={[
        "Day, week and month views with your class times, due dates and exams in course colors.",
        "Add class times per course; syllabus import fills them in for you later.",
        "A feed you can subscribe to in Google Calendar.",
      ]}
    />
  );
}
