import { useMemo } from "native-ui";

function escapeRawHtml(source: string): string {
  return source.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function sanitizeMarkdown(source: string): string {
  const math: string[] = [];
  const protectedSource = String(source ?? "").replace(/\\\[([\s\S]+?)\\\]|\\\((.+?)\\\)/g, (_, displayMath, inlineMath) => {
    const value = displayMath ?? inlineMath ?? "";
    const token = `LQSMATHTOKEN${math.length}ENDTOKEN`;
    const mathHtml = window.katex?.renderToString
      ? window.katex.renderToString(value, { displayMode: Boolean(displayMath), throwOnError: false, trust: false })
      : `<span class="native-math">${escapeRawHtml(value)}</span>`;
    math.push(mathHtml);
    return token;
  });
  const escaped = escapeRawHtml(protectedSource);
  const rendered = window.marked?.parse
    ? window.marked.parse(escaped)
    : `<p>${escaped.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, '<a href="$2">$1</a>').replace(/\n/g, "<br>")}</p>`;
  const sanitized = window.DOMPurify?.sanitize ? window.DOMPurify.sanitize(rendered) : rendered;
  const template = document.createElement("template");
  template.innerHTML = sanitized.replace(/LQSMATHTOKEN(\d+)ENDTOKEN/g, (_, index) => math[Number(index)] ?? "");
  template.content.querySelectorAll("a").forEach((link) => {
    const value = link.getAttribute("href") ?? "";
    try {
      const url = new URL(value, window.location.href);
      if (!/^https?:$/.test(url.protocol)) link.removeAttribute("href");
      else {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    } catch {
      link.removeAttribute("href");
    }
  });
  return template.innerHTML;
}

export function Markdown({ source, className = "markdown" }: { source: string; className?: string }) {
  const html = useMemo(() => sanitizeMarkdown(source), [source]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function hasFormulaPrefix(value: string): boolean {
  const normalized = String(value ?? "").replace(/^[\u0000-\u0020\uFEFF]+/, "");
  if (/^[=+@]/.test(normalized)) return true;
  return /^-(?!\d+(?:\.\d+)?$)/.test(normalized);
}

export function escapeCsvFormula(value: string): string {
  return hasFormulaPrefix(value) ? `'${value}` : value;
}
