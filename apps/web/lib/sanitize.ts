/**
 * XSS mitigation (P0 Security 3.1a): sanitize HTML from user/DB before rendering.
 * Allows only safe tags and attributes; strips script, iframe, event handlers.
 */
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "b", "i", "u", "a", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "blockquote", "span", "div", "img",
]);
const ALLOWED_ATTRS = new Set(["href", "src", "alt", "title", "class", "target", "rel", "style"]);

const ALLOWED_STYLE_PROPS = new Set([
  "text-align",
  "font-size",
  "font-weight",
  "font-style",
  "text-decoration",
]);

function sanitizeUrl(value: string, attrName: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  if (attrName === "src" && trimmed.startsWith("data:image/")) return trimmed;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:") || lower.startsWith("tel:")) {
    return trimmed;
  }
  return null;
}

function sanitizeStyle(styleValue: string): string | null {
  const safeRules: string[] = [];
  const declarations = styleValue.split(";");
  const fontSizePattern = /^(xx-small|x-small|small|medium|large|x-large|xx-large|smaller|larger|\d{1,3}px|\d{1,2}(\.\d+)?rem|\d{1,2}(\.\d+)?em|\d{1,3}%)$/;

  for (const declaration of declarations) {
    const [rawProp, rawVal] = declaration.split(":");
    if (!rawProp || !rawVal) continue;
    const prop = rawProp.trim().toLowerCase();
    const val = rawVal.trim().toLowerCase();
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue;

    if (prop === "text-align" && ["left", "center", "right", "justify"].includes(val)) {
      safeRules.push(`${prop}:${val}`);
      continue;
    }
    if (prop === "font-size" && fontSizePattern.test(val)) {
      safeRules.push(`${prop}:${val}`);
      continue;
    }
    if (prop === "font-weight" && (/^\d{3}$/.test(val) || ["normal", "bold", "bolder", "lighter"].includes(val))) {
      safeRules.push(`${prop}:${val}`);
      continue;
    }
    if (prop === "font-style" && ["normal", "italic", "oblique"].includes(val)) {
      safeRules.push(`${prop}:${val}`);
      continue;
    }
    if (prop === "text-decoration" && ["none", "underline", "line-through", "overline"].includes(val)) {
      safeRules.push(`${prop}:${val}`);
    }
  }

  return safeRules.length > 0 ? safeRules.join(";") : null;
}

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  let out = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");
  // Restrict to allowed tags: strip others (keep content)
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  out = out.replace(tagRegex, (match) => {
    const tag = (match.match(/<\/?([a-z][a-z0-9]*)/i) ?? [])[1]?.toLowerCase();
    if (!tag) return "";
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (match.startsWith("</")) return `</${tag}>`;
    const attrPart = match.slice(1 + tag.length, -1);
    const safeAttrs: string[] = [];
    const attrRegex = /([^\s=/>]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let attrMatch: RegExpExecArray | null = attrRegex.exec(attrPart);

    while (attrMatch) {
      const attrName = (attrMatch[1] || "").toLowerCase();
      const attrValue = attrMatch[3] ?? attrMatch[4] ?? attrMatch[5] ?? "";

      if (ALLOWED_ATTRS.has(attrName)) {
        if (attrName === "href" || attrName === "src") {
          const safeUrl = sanitizeUrl(attrValue, attrName);
          if (safeUrl) safeAttrs.push(`${attrName}="${safeUrl}"`);
        } else if (attrName === "style") {
          const safeStyle = sanitizeStyle(attrValue);
          if (safeStyle) safeAttrs.push(`style="${safeStyle}"`);
        } else if (attrValue) {
          safeAttrs.push(`${attrName}="${attrValue.replace(/"/g, "&quot;")}"`);
        }
      }

      attrMatch = attrRegex.exec(attrPart);
    }

    return safeAttrs.length > 0 ? `<${tag} ${safeAttrs.join(" ")}>` : `<${tag}>`;
  });
  return out;
}
