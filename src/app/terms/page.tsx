import type { Metadata } from "next";
import { CONTACT, LegalPage, Section } from "../legal";

export const metadata: Metadata = {
  title: "Terms · Sonnet",
  description: "The rules for using Sonnet.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <LegalPage title="Terms">
      <Section title="Using Sonnet">
        <p>
          Sonnet is a student hub for courses, deadlines, grades, materials, a focus timer and an AI assistant, run by
          Eric Wei. By creating an account or using Sonnet you agree to these terms and to the{" "}
          <a href="/privacy" className="link">
            Privacy page
          </a>
          . If you don&apos;t agree, don&apos;t use it.
        </p>
      </Section>

      <Section title="Your account">
        <p>
          Give a real email you control and keep your password safe. You&apos;re responsible for what happens under
          your account. Tell us if you think someone else has got into it.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          What you add (courses, notes, files, chats) stays yours. You give Sonnet permission to store it, process it
          and send it to the services described in the Privacy page, only to run Sonnet for you. Only upload things you
          have the right to use, and follow your school&apos;s rules about course materials.
        </p>
      </Section>

      <Section title="What you can&apos;t do">
        <ul>
          <li>Break the law or break someone else&apos;s rights.</li>
          <li>Probe, overload or attack Sonnet, or get around its limits.</li>
          <li>Use Sonnet to cheat in ways your school prohibits. How you use its answers is on you.</li>
          <li>Use another person&apos;s account, or Canvas token, without their permission.</li>
        </ul>
      </Section>

      <Section title="The AI can be wrong">
        <p>
          Sonnet AI makes mistakes. It can misread a syllabus, get a date or a grade calculation wrong, or state
          something false with confidence. Check anything that matters, especially deadlines and grades, against your
          syllabus, your school&apos;s system and your instructor. Canvas data in Sonnet may be out of date until the next
          sync.
        </p>
      </Section>

      <Section title="Plans and limits">
        <p>
          Sonnet is free to use today, with limits on things that cost money to run, such as the weekly allowance for
          Sonnet AI and how many Canvas courses a free account imports. Limits can change. If paid plans are added,
          prices and what they include will be shown before you pay, and these terms will be updated first.
        </p>
      </Section>

      <Section title="Third-party services">
        <p>
          Sonnet works with services it doesn&apos;t control, such as Canvas and Google Calendar. They can change or
          stop working, and Sonnet isn&apos;t responsible for them.
        </p>
      </Section>

      <Section title="Ending things">
        <p>
          You can stop any time and delete your account in Settings → Data. Sonnet may suspend or remove accounts that
          break these terms or put the service at risk. Sonnet may also change or end features; if it ends the service,
          it will give notice and a chance to download your data.
        </p>
      </Section>

      <Section title="No guarantees">
        <p>
          Sonnet is provided as is and as available, without promises that it will always work, be error-free or keep
          your data safe from every loss. Download your data from time to time. To the extent the law allows, Sonnet
          and its maker aren&apos;t liable for indirect or lost-opportunity damages, such as a missed deadline or a
          grade, and total liability is limited to what you paid Sonnet in the previous 12 months (nothing, for a free
          account). Some places don&apos;t allow these limits, so they apply only as far as the law permits.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>
          These terms may change. If a change matters, Sonnet will say so in the app before it applies, and continuing
          to use Sonnet after that means you accept it. Questions: {CONTACT}.
        </p>
      </Section>
    </LegalPage>
  );
}
