import { ComingSoon } from "@/components/coming-soon";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Materials · Sonnet" };

export default async function Materials() {
  await requireUser();
  return (
    <ComingSoon
      title="Materials"
      phase={6}
      points={[
        "Drop in PDFs, Word docs, PowerPoints, photos, notes or links, sorted by course.",
        "Upload a syllabus and the AI pulls out deadlines, exams, class times and grade weights for you to review.",
        "Everything you upload becomes context the assistant can use.",
        "Later: lecture audio, video and YouTube.",
      ]}
    />
  );
}
