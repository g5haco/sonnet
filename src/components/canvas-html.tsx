"use client";

import { useMemo, useState, type ReactNode } from "react";

// Canvas descriptions are teacher-written HTML. The browser's DOMParser builds an inert document (no scripts
// run, nothing loads), and only the tags and attributes below are copied out as React elements: no
// dangerouslySetInnerHTML, no inline styles or handlers, links only to http(s)/mailto.
const KEEP = new Set(
  "p br strong b em i u s sub sup h1 h2 h3 h4 h5 h6 ul ol li a img blockquote pre code table thead tbody tfoot tr th td hr".split(" "),
);
// Dropped with everything inside; any other unknown tag (span, div, font...) is unwrapped to its children.
const DROP = new Set(
  "script style noscript template object embed form input button select textarea svg math link meta head title".split(" "),
);

function safeUrl(value: string | null, base?: string) {
  if (!value) return null;
  try {
    const url = new URL(value, base);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

// Canvas files often need a Canvas login; a broken image turns into a plain link instead.
function Img({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <a href={src} {...external}>
      {alt || "Image"} (opens in Canvas)
    </a>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- remote Canvas files, unknown sizes
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
  );
}

// Tables only allow elements as children in React; the line breaks between <tr>/<td> tags are dropped.
const TABLE_PARTS = new Set(["table", "thead", "tbody", "tfoot", "tr"]);

function convert(node: Node, key: number, base?: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE)
    return TABLE_PARTS.has(node.parentElement?.tagName.toLowerCase() ?? "") && !node.textContent?.trim()
      ? null
      : node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (DROP.has(tag)) return null;
  const kids = [...el.childNodes].map((child, i) => convert(child, i, base));

  if (tag === "iframe") {
    const src = safeUrl(el.getAttribute("src"), base);
    return src ? (
      <a key={key} href={src} {...external}>
        Embedded content ↗
      </a>
    ) : null;
  }
  if (!KEEP.has(tag)) return kids.length ? <span key={key}>{kids}</span> : null;
  if (tag === "a") {
    const href = safeUrl(el.getAttribute("href"), base);
    return href ? (
      <a key={key} href={href} {...external}>
        {kids}
      </a>
    ) : (
      <span key={key}>{kids}</span>
    );
  }
  if (tag === "img") {
    const src = safeUrl(el.getAttribute("src"), base);
    return src ? <Img key={key} src={src} alt={el.getAttribute("alt") ?? ""} /> : null;
  }
  if (tag === "br" || tag === "hr") return tag === "br" ? <br key={key} /> : <hr key={key} />;
  // Headings sit under the dialog's title, so they're demoted to h3/h4.
  const Tag = (/^h[1-2]$/.test(tag) ? "h3" : /^h[3-6]$/.test(tag) ? "h4" : tag) as "p";
  const span = (name: string) => {
    const n = Number(el.getAttribute(name));
    return Number.isInteger(n) && n > 1 && n < 100 ? n : undefined;
  };
  const cell = tag === "td" || tag === "th" ? { colSpan: span("colspan"), rowSpan: span("rowspan") } : {};
  const out = (
    <Tag key={key} {...cell}>
      {kids}
    </Tag>
  );
  return tag === "table" ? (
    <div key={key} className="overflow-x-auto">
      {out}
    </div>
  ) : (
    out
  );
}

export function CanvasHtml({ html, base }: { html: string; base?: string }) {
  const content = useMemo(() => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return [...doc.body.childNodes].map((node, i) => convert(node, i, base));
  }, [html, base]);
  return (
    <div className="text-[15px] leading-relaxed text-pretty [overflow-wrap:anywhere] [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:font-mono [&_h3]:mt-4 [&_h3]:font-medium [&_h4]:mt-3 [&_h4]:font-medium [&_hr]:my-4 [&_hr]:border-border [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-background [&_pre]:p-3 [&_table]:my-2 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-5">
      {content}
    </div>
  );
}
