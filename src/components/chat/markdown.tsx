"use client";

import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAssistant } from "@/components/app-shell";
import { ClassLink, CodeBlock, CourseLink, ItemLink, PlanCard, WorkCard } from "@/components/chat/widgets";

// The assistant writes Markdown; this renders it the way chat apps do (headings, lists, tables, code with a
// copy button) plus Sonnet's own pieces: item:/course:/class: links become live chips, and ```work / ```plan
// blocks become cards (see the rules in lib/ai.ts).

type MdNode = { type: string; value?: string; url?: string; children?: MdNode[] };
type HNode = { type: string; value?: string; properties?: { className?: unknown }; children?: HNode[] };

// Our link schemes survive the URL sanitizer; everything else goes through the default one.
const urlTransform = (url: string) => (/^(item|course|class):/.test(url) ? url : defaultUrlTransform(url));

// Safety net for models that paste the context's raw lines anyway: drop stray refs and status words.
const tidy = (md: string) =>
  md
    .replace(/\s*[·(]\s*(?:class )?ref [0-9a-f]{6}\)?/g, "")
    .replace(/ · open$/gm, "")
    .replace(/ · OVERDUE$/gm, " · **overdue**");

// A remark plugin: course codes anywhere in the text become course links, so the model needn't remember to.
const linkCourses = (courses: { id: string; code: string }[]) => () => (tree: MdNode) => {
  const known = courses.filter((c) => c.code.trim());
  if (!known.length) return;
  const ids = new Map(known.map((c) => [c.code.toLowerCase(), c.id]));
  const escaped = known.map((c) => c.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((a, b) => b.length - a.length);
  const re = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  const walk = (node: MdNode) => {
    if (!node.children || node.type === "link") return; // never inside an existing link
    node.children = node.children.flatMap((child) => {
      if (child.type !== "text") {
        walk(child);
        return [child];
      }
      const text = child.value ?? "";
      const out: MdNode[] = [];
      let at = 0;
      for (const m of text.matchAll(re)) {
        if (m.index > at) out.push({ type: "text", value: text.slice(at, m.index) });
        out.push({
          type: "link",
          url: `course:${ids.get(m[0].toLowerCase())}`,
          children: [{ type: "text", value: m[0] }],
        });
        at = m.index + m[0].length;
      }
      if (!out.length) return [child];
      if (at < text.length) out.push({ type: "text", value: text.slice(at) });
      return out;
    });
  };
  walk(tree);
};

const textOf = (n?: HNode): string => (n?.type === "text" ? (n.value ?? "") : (n?.children ?? []).map(textOf).join(""));

const components: Components = {
  p: ({ children }) => <p className="my-2.5 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2.5 ml-5 list-disc space-y-1.5 marker:text-muted-foreground">{children}</ul>,
  ol: ({ children }) => (
    <ol className="my-2.5 ml-5 list-decimal space-y-1.5 marker:font-mono marker:text-muted-foreground">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  h1: ({ children }) => <h3 className="mt-5 mb-2 text-lg font-semibold tracking-tight first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-5 mb-2 text-base font-semibold tracking-tight first:mt-0">{children}</h3>,
  h3: ({ children }) => <h3 className="mt-4 mb-1.5 text-base font-semibold tracking-tight first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-3 mb-1 font-semibold first:mt-0">{children}</h4>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 rounded-xl bg-secondary px-4 py-2.5 text-muted-foreground">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border bg-secondary px-3 py-2 font-mono text-xs font-medium text-muted-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-border px-3 py-2 align-top">{children}</td>,
  a: ({ href = "", children }) => {
    const [scheme, ref = ""] = href.split(":");
    if (scheme === "item") return <ItemLink refId={ref}>{children}</ItemLink>;
    if (scheme === "course") return <CourseLink id={href.slice(7)}>{children}</CourseLink>;
    if (scheme === "class") return <ClassLink refId={ref}>{children}</ClassLink>;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium link">
        {children}
      </a>
    );
  },
  // Fenced blocks arrive as <pre><code class="language-x">: widgets by language, code blocks otherwise.
  pre: ({ node }) => {
    const code = (node as HNode | undefined)?.children?.[0];
    const cls = code?.properties?.className;
    const lang = String(Array.isArray(cls) ? cls[0] : (cls ?? "")).replace(/^language-/, "");
    const text = textOf(code).replace(/\n$/, "");
    if (lang === "work") return <WorkCard text={text} />;
    if (lang === "plan") return <PlanCard text={text} />;
    return <CodeBlock lang={lang} text={text} />;
  },
  code: ({ children }) => (
    <code className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.88em]">{children}</code>
  ),
};

export function Markdown({ text }: { text: string }) {
  const { courses } = useAssistant();
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, linkCourses(courses)]}
      urlTransform={urlTransform}
      components={components}
    >
      {tidy(text)}
    </ReactMarkdown>
  );
}
