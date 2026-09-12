/*
 * Local Quiz Studio native browser runtime.
 *
 * This file intentionally uses browser standards only. It provides the small
 * icon, Markdown and mathematical-notation features that the UI needs without
 * loading a third-party JavaScript library.
 */
(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const ICONS = Object.freeze({
    download: ["M12 3v11", "m7 10 5 5 5-5", "M5 20h14"],
    upload: ["M12 21V10", "m7 14 5-5 5 5", "M5 4h14"],
    wrench: ["M14.5 6.5a4 4 0 0 0-5-5l2.2 2.2-2.8 2.8-2.2-2.2a4 4 0 0 0 5 5L17 20.6a2 2 0 0 0 2.8-2.8Z"],
    "chevron-right": ["m9 5 7 7-7 7"],
    "chevron-left": ["m15 5-7 7 7 7"],
    "chevron-down": ["m5 9 7 7 7-7"],
    archive: ["M4 7h16", "M5 7v13h14V7", "M3 3h18v4H3Z", "M9 11h6"],
    "circle-help": ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M9.5 9a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.1.9-1.1 1.6", "M12 17h.01"],
    shuffle: ["M3 6h3c5 0 7 12 12 12h3", "m18 15 3 3-3 3", "M3 18h3c2 0 3.4-2 4.6-4.5", "M14 7.5c1.1-1 2.3-1.5 4-1.5h3", "m18 3 3 3-3 3"],
    "arrow-down-wide-narrow": ["M7 4v16", "m4 16-4 4-4-4", "M13 6h8", "M13 11h6", "M13 16h4"],
    "list-checks": ["m3 6 2 2 3-4", "M11 6h10", "m3 12 2 2 3-4", "M11 12h10", "m3 18 2 2 3-4", "M11 18h10"],
    "list-todo": ["M11 6h10", "M11 12h10", "M11 18h10", "M3 4h4v4H3Z", "M3 10h4v4H3Z", "M3 16h4v4H3Z"],
    search: ["M21 21l-4.4-4.4", "M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z"],
    x: ["M5 5l14 14", "M19 5 5 19"],
    check: ["m4 12 5 5L20 6"],
    filter: ["M3 5h18l-7 8v6l-4 2v-8Z"],
    calculator: ["M5 2h14v20H5Z", "M8 6h8", "M8 11h.01", "M12 11h.01", "M16 11h.01", "M8 15h.01", "M12 15h.01", "M16 15h.01", "M8 19h.01", "M12 19h4"],
    ban: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M5 5l14 14"],
    "line-chart": ["M3 3v18h18", "m6 15 4-5 3 3 5-7"],
    "fast-forward": ["m3 5 8 7-8 7Z", "m12 5 8 7-8 7Z"],
    clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M12 6v6l4 2"],
    mouse: ["M12 22a7 7 0 0 0 7-7V9A7 7 0 0 0 5 9v6a7 7 0 0 0 7 7Z", "M12 2v7"],
    palette: ["M12 3 a9 9 0 1 0 0 18 h1.5 a2 2 0 0 0 0 -4 H12 a2 2 0 1 1 0 -4 h1 a7 7 0 0 0 0 -14 h-1 Z", "M7.5 10h.01", "M9.5 6.5h.01", "M14 6h.01", "M17 9h.01"],
    sparkles: ["m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2Z", "m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8Z", "M5 3v4", "M3 5h4"],
    scan: ["M3 8V3h5", "M16 3h5v5", "M21 16v5h-5", "M8 21H3v-5"],
    "trash-2": ["M4 7h16", "M9 7V4h6v3", "M6 7l1 14h10l1-14", "M10 11v6", "M14 11v6"],
    "file-x-2": ["M6 2h8l4 4v16H6Z", "M14 2v5h5", "m9 12 6 6", "m15 12-6 6"],
    "layers-2": ["m12 2 9 5-9 5-9-5Z", "m3 12 9 5 9-5", "m3 17 9 5 9-5"],
    "book-x": ["M4 4a4 4 0 0 1 4-1h4v17H8a4 4 0 0 0-4 1Z", "M12 3h4a4 4 0 0 1 4 4v14a4 4 0 0 0-4-1h-4", "m15 8 4 4", "m19 8-4 4"],
    "layout-dashboard": ["M3 3h8v8H3Z", "M13 3h8v5h-8Z", "M13 10h8v11h-8Z", "M3 13h8v8H3Z"],
    "bar-chart-3": ["M3 3v18h18", "M7 16v2", "M12 11v7", "M17 6v12"],
    route: ["M5 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M19 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M5 13V8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3"],
    brain: ["M9 4a3 3 0 0 0-5 2.2A3.5 3.5 0 0 0 3 13a3.5 3.5 0 0 0 3 6h3Z", "M15 4a3 3 0 0 1 5 2.2A3.5 3.5 0 0 1 21 13a3.5 3.5 0 0 1-3 6h-3Z", "M9 4v16", "M15 4v16"],
    "calendar-check": ["M4 5h16v16H4Z", "M8 2v6", "M16 2v6", "M4 10h16", "m8 15 2 2 4-4"],
    "book-open": ["M3 5a7 7 0 0 1 9 1v15a7 7 0 0 0-9-1Z", "M21 5a7 7 0 0 0-9 1v15a7 7 0 0 1 9-1Z"],
    copy: ["M8 8h12v12H8Z", "M4 4h12v4", "M4 4v12h4"],
    "brain-circuit": ["M9 4a3 3 0 0 0-5 3v10a3 3 0 0 0 5 3", "M15 4a3 3 0 0 1 5 3v10a3 3 0 0 1-5 3", "M9 4v16", "M15 4v16", "M9 9h6", "M9 15h6"],
    send: ["M3 4l18 8-18 8 4-8Z", "M7 12h14"],
    "refresh-cw": ["M20 7V3l-3 3a8 8 0 1 0 2 9", "M20 3v6h-6"],
    play: ["m7 4 13 8-13 8Z"],
    "rotate-ccw": ["M3 7V3l4 4", "M3 3h6a9 9 0 1 1-6 15"],
    timer: ["M9 2h6", "M12 5a8 8 0 1 0 8 8", "M12 9v4l3 2"],
    "skip-forward": ["m5 4 10 8-10 8Z", "M19 5v14"],
    "external-link": ["M14 4h6v6", "M20 4l-9 9", "M18 13v7H4V6h7"],
    "volume-2": ["M4 10v4h4l5 4V6l-5 4Z", "M16 9a4 4 0 0 1 0 6", "M18 6a8 8 0 0 1 0 12"],
    "audio-lines": ["M4 10v4", "M8 7v10", "M12 3v18", "M16 7v10", "M20 10v4"],
    minimize: ["m8 3 0 5-5 0", "m16 3 0 5 5 0", "m8 21 0-5-5 0", "m16 21 0-5 5 0"],
    images: ["M4 7H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-1", "M8 2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z", "m6 14 4-4 3 3 4-5 5 6", "M10 6h.01"],
    "image-plus": ["M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8", "M19 1v8", "M15 5h8", "m3 16 5-5 4 4 3-3 6 6", "M8 7h.01"],
    "settings-2": ["M4 6h10", "M18 6h2", "M14 4v4", "M4 12h3", "M11 12h9", "M7 10v4", "M4 18h12", "M20 18h0", "M16 16v4"],
    "arrow-up": ["M12 19V5", "m5 12 7-7 7 7"],
    "user-round": ["M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z", "M4 22a8 8 0 0 1 16 0"],
    "triangle-alert": ["M12 3 2 21h20Z", "M12 9v5", "M12 18h.01"],
    "message-circle-more": ["M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 21l2.1-5.3A8.5 8.5 0 1 1 21 11.5Z", "M8 12h.01", "M12 12h.01", "M16 12h.01"],
    sun: ["M12 4V2", "M12 22v-2", "M4 12H2", "M22 12h-2", "M5 5l-1.5-1.5", "M20.5 20.5 19 19", "M19 5l1.5-1.5", "M3.5 20.5 5 19", "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"],
    moon: ["M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"],
  });

  function makeIcon(name, source) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.dataset.lucide = name;
    svg.classList.add("lucide", `lucide-${name}`);
    for (const className of source.classList) svg.classList.add(className);
    for (const pathData of ICONS[name] || ["M4 4h16v16H4Z", "M8 12h8"]) {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", pathData);
      svg.append(path);
    }
    return svg;
  }

  function createIcons(root = document) {
    root.querySelectorAll("i[data-lucide]").forEach((node) => {
      node.replaceWith(makeIcon(node.dataset.lucide || "", node));
    });
  }

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  function safeHref(raw) {
    try {
      const url = new URL(String(raw || ""), location.href);
      return ["http:", "https:"].includes(url.protocol) ? escapeHtml(url.href) : "";
    } catch {
      return "";
    }
  }

  function inlineMarkdown(raw) {
    const code = [];
    let text = String(raw || "").replace(/`([^`]+)`/g, (_, value) => {
      const token = `NATIVECODETOKEN${code.length}ENDTOKEN`;
      code.push(`<code>${escapeHtml(value)}</code>`);
      return token;
    });
    text = escapeHtml(text)
      .replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_, label, href) => {
        const safe = safeHref(href);
        return safe ? `<a href="${safe}">${label}</a>` : label;
      })
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
    return text.replace(/NATIVECODETOKEN(\d+)ENDTOKEN/g, (_, index) => code[Number(index)] || "");
  }

  function parseMarkdown(source) {
    const lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
    const html = [];
    let paragraph = [];
    let list = "";
    let quote = [];
    let fenced = false;
    let fenceLines = [];
    const flushParagraph = () => {
      if (!paragraph.length) return;
      html.push(`<p>${inlineMarkdown(paragraph.join("\n")).replaceAll("\n", "<br>")}</p>`);
      paragraph = [];
    };
    const closeList = () => {
      if (!list) return;
      html.push(`</${list}>`);
      list = "";
    };
    const flushQuote = () => {
      if (!quote.length) return;
      html.push(`<blockquote><p>${inlineMarkdown(quote.join("\n")).replaceAll("\n", "<br>")}</p></blockquote>`);
      quote = [];
    };
    for (const line of lines) {
      if (/^\s*```/.test(line)) {
        flushParagraph(); closeList(); flushQuote();
        if (fenced) {
          html.push(`<pre><code>${escapeHtml(fenceLines.join("\n"))}</code></pre>`);
          fenceLines = [];
        }
        fenced = !fenced;
        continue;
      }
      if (fenced) { fenceLines.push(line); continue; }
      if (!line.trim()) { flushParagraph(); closeList(); flushQuote(); continue; }
      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        flushParagraph(); closeList(); flushQuote();
        const level = heading[1].length;
        html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
        continue;
      }
      if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) {
        flushParagraph(); closeList(); flushQuote(); html.push("<hr>"); continue;
      }
      const item = line.match(/^\s*([-*+] |\d+[.)] )(.+)$/);
      if (item) {
        flushParagraph(); flushQuote();
        const nextList = /^\d/.test(item[1]) ? "ol" : "ul";
        if (list !== nextList) { closeList(); list = nextList; html.push(`<${list}>`); }
        html.push(`<li>${inlineMarkdown(item[2])}</li>`);
        continue;
      }
      const quoted = line.match(/^\s*>\s?(.*)$/);
      if (quoted) { flushParagraph(); closeList(); quote.push(quoted[1]); continue; }
      flushQuote(); closeList(); paragraph.push(line);
    }
    if (fenced) html.push(`<pre><code>${escapeHtml(fenceLines.join("\n"))}</code></pre>`);
    flushParagraph(); closeList(); flushQuote();
    return html.join("\n");
  }

  const ALLOWED_TAGS = new Set(["A", "BLOCKQUOTE", "BR", "CODE", "EM", "H1", "H2", "H3", "H4", "HR", "LI", "OL", "P", "PRE", "STRONG", "TABLE", "TBODY", "TD", "TH", "THEAD", "TR", "UL"]);
  function sanitizeHtml(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    const visit = (parent) => {
      [...parent.childNodes].forEach((node) => {
        if (node.nodeType === Node.COMMENT_NODE) { node.remove(); return; }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (!ALLOWED_TAGS.has(node.tagName)) {
          node.replaceWith(document.createTextNode(node.textContent || ""));
          return;
        }
        const originalHref = node.tagName === "A" ? node.getAttribute("href") : "";
        [...node.attributes].forEach((attribute) => node.removeAttribute(attribute.name));
        if (node.tagName === "A") {
          const href = safeHref(originalHref);
          if (href) node.setAttribute("href", href);
        }
        visit(node);
      });
    };
    visit(template.content);
    return template.innerHTML;
  }

  function plainMathText(tex) {
    return String(tex || "")
      .replace(/\\(?:mathrm|mathbf|text)\{([^{}]*)\}/g, "$1")
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)⁄($2)")
      .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
      .replace(/\\times/g, "×").replace(/\\div/g, "÷").replace(/\\cdot/g, "·")
      .replace(/\\leq?/g, "≤").replace(/\\geq?/g, "≥").replace(/\\neq/g, "≠")
      .replace(/\\infty/g, "∞").replace(/\\pi/g, "π").replace(/\\theta/g, "θ")
      .replace(/\\alpha/g, "α").replace(/\\beta/g, "β").replace(/\\gamma/g, "γ")
      .replace(/\\sum/g, "Σ").replace(/\\int/g, "∫").replace(/\\pm/g, "±")
      .replace(/\^\{([^{}]+)\}/g, "^$1").replace(/_\{([^{}]+)\}/g, "_$1")
      .replace(/[{}]/g, "")
      .replace(/\\,/g, " ").replace(/\\ /g, " ").replace(/\\([A-Za-z]+)/g, "$1");
  }

  function renderMath(tex, target, options = {}) {
    target.replaceChildren();
    const outer = document.createElement(options.displayMode ? "div" : "span");
    outer.className = options.displayMode ? "katex-display native-math-display" : "katex native-math";
    const inner = document.createElement("span");
    inner.className = "katex native-math";
    inner.textContent = plainMathText(tex);
    outer.append(inner);
    target.append(outer);
  }

  function renderMathInElement(root, options = {}) {
    const delimiters = options.delimiters || [
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false },
    ];
    const ignored = new Set(["SCRIPT", "STYLE", "TEXTAREA", "PRE", "CODE"]);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (!ignored.has(walker.currentNode.parentElement?.tagName)) nodes.push(walker.currentNode);
    for (const textNode of nodes) {
      const text = textNode.nodeValue || "";
      let cursor = 0;
      const fragments = [];
      while (cursor < text.length) {
        let selected = null;
        for (const delimiter of delimiters) {
          const start = text.indexOf(delimiter.left, cursor);
          if (start < 0) continue;
          if (!selected || start < selected.start) selected = { ...delimiter, start };
        }
        if (!selected) break;
        const end = text.indexOf(selected.right, selected.start + selected.left.length);
        if (end < 0) break;
        if (selected.start > cursor) fragments.push(document.createTextNode(text.slice(cursor, selected.start)));
        const host = document.createElement(selected.display ? "div" : "span");
        renderMath(text.slice(selected.start + selected.left.length, end), host, { displayMode: selected.display });
        fragments.push(host.firstChild);
        cursor = end + selected.right.length;
      }
      if (!fragments.length) continue;
      if (cursor < text.length) fragments.push(document.createTextNode(text.slice(cursor)));
      textNode.replaceWith(...fragments);
    }
  }

  window.lucide = { createIcons };
  window.marked = { parse: parseMarkdown };
  window.DOMPurify = { sanitize: sanitizeHtml };
  window.katex = {
    render: renderMath,
    renderToString(tex, options = {}) {
      const host = document.createElement("span");
      renderMath(tex, host, options);
      return host.innerHTML;
    },
  };
  window.renderMathInElement = renderMathInElement;
  window.LocalQuizNativeRuntime = Object.freeze({ createIcons, parseMarkdown, sanitizeHtml, renderMathInElement });
})();
