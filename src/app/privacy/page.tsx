import type { Metadata } from "next";
import { CONTACT, LegalPage, Section } from "../legal";

export const metadata: Metadata = {
  title: "Privacy · Sonnet",
  description: "What Sonnet stores about you, where it lives, who sees it, and how to delete it.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <LegalPage title="Privacy">
      <Section title="The short version">
        <p>
          Sonnet is a student hub made by one person, Eric Wei. What you put in it is private to your account unless
          you share a flashcard deck. It isn&apos;t sold, shared with advertisers or shown to your school. You can download everything or delete your
          account yourself in Settings → Data.
        </p>
      </Section>

      <Section title="What Sonnet stores">
        <ul>
          <li>
            <strong>Your account:</strong> your email, your name if you give one, and a password hash (or your Google
            sign-in) kept by Supabase Auth.
          </li>
          <li>
            <strong>Your academic data:</strong> courses, assignments, exams, class times, grades, notes and links you
            add, your term dates and your Home layout.
          </li>
          <li>
            <strong>Files you upload:</strong> PDFs, documents, slides and photos, plus the text read out of them so
            Sonnet AI can use it.
          </li>
          <li>
            <strong>Sonnet AI:</strong> your chats, saved flashcard decks, and a usage log (what kind of request, the
            model, token counts and cost) used to apply weekly allowances and understand costs.
          </li>
          <li>
            <strong>Shared decks:</strong> if you share a flashcard deck, anyone with its link can read the deck&apos;s
            title and cards, signed in or not, until you delete the deck or your account.
          </li>
          <li>
            <strong>Focus timer:</strong> your focus sessions, so the heatmap and streak work.
          </li>
          <li>
            <strong>Canvas, if you connect it:</strong> your Canvas address and access token (the token is encrypted
            before it is stored) and, if you add it, your Canvas calendar link. Sonnet only reads from Canvas. You can
            disconnect in Sync, and you can revoke the token in Canvas any time.
          </li>
          <li>
            <strong>Your calendar feed:</strong> a secret link you can give to Google Calendar. Replace it in Sync and
            the old one stops working.
          </li>
          <li>
            <strong>Abuse limits:</strong> a short-lived count of how often you use costly features per hour.
          </li>
        </ul>
        <p>
          In your browser, Sonnet keeps a sign-in session cookie and a few settings in local storage (for example the
          focus timer, whether you have seen the tour, and a quick note). There are no advertising or tracking cookies.
        </p>
      </Section>

      <Section title="Who handles it">
        <ul>
          <li>
            <strong>Supabase</strong> stores the database, sign-in and uploaded files.
          </li>
          <li>
            <strong>Vercel</strong> hosts the app, so requests pass through it and it keeps ordinary server logs.
          </li>
          <li>
            <strong>OpenRouter and the AI model providers it routes to</strong> receive what you send to Sonnet AI.
            See the next section.
          </li>
          <li>
            <strong>Your email provider</strong> carries the sign-in and confirmation emails Supabase sends you.
          </li>
          <li>
            <strong>Google</strong>, only if you use Continue with Google, or add Sonnet&apos;s calendar feed to Google
            Calendar yourself.
          </li>
        </ul>
        <p>These services run on their own terms and privacy policies. Sonnet doesn&apos;t sell your data.</p>
      </Section>

      <Section title="What the AI sees">
        <p>
          When you ask Sonnet AI something, Sonnet sends your message and the parts of your data it needs to answer
          (for example course names, deadlines, class times, grades, and text from a syllabus or material you ask
          about) to OpenRouter, which passes it to a model provider. Photos and files you attach to a message go too.
          If web search is used, the search query leaves Sonnet as well.
        </p>
        <p>
          Sonnet uses a mix of free and paid models, and the mix changes. Providers set their own rules for logging
          prompts, and providers of free models may keep prompts and use them to improve their models. If that matters
          to you, don&apos;t put anything in your chats or materials that you wouldn&apos;t want a model provider to
          see. Sonnet AI is only called when you use it; nothing is sent in the background.
        </p>
      </Section>

      <Section title="Your control">
        <ul>
          <li>
            <strong>Download:</strong> Settings → Data → Download my data gives you a JSON file of everything stored
            about you, except secrets. Uploaded files are listed in it, not included.
          </li>
          <li>
            <strong>Reset:</strong> clears your courses, files, chats and term dates but keeps your login.
          </li>
          <li>
            <strong>Delete:</strong> permanently deletes your login, files and every record. It happens immediately.
            Copies in provider backups, if any, are removed on the provider&apos;s own schedule. Logs kept by Vercel and
            AI providers follow their own retention.
          </li>
        </ul>
      </Section>

      <Section title="Security">
        <p>
          Data is encrypted in transit. Each account can read only its own rows, enforced in the database itself, and
          uploaded files sit in a private folder per account. No system is perfectly secure; if something affecting you
          goes wrong, Sonnet will tell you.
        </p>
      </Section>

      <Section title="Students and schools">
        <p>
          Sonnet is a tool you choose to use on your own. It isn&apos;t run by or connected to your school, and it
          doesn&apos;t share what you store with your school. Follow your school&apos;s rules about what you may upload
          and about Canvas access tokens.
        </p>
      </Section>

      <Section title="Changes and contact">
        <p>
          If this changes in a way that matters, Sonnet will say so in the app before it takes effect. Questions or
          requests: {CONTACT}.
        </p>
      </Section>
    </LegalPage>
  );
}
