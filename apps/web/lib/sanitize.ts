/**
 * XSS mitigation (P0 Security 3.1a): sanitize HTML from user/DB before rendering.
 * Allows only safe tags and attributes; strips script, iframe, event handlers.
 */
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "b", "i", "u", "a", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "blockquote", "span", "div", "img",
]);
const ALLOWED_ATTRS = new Set(["href", "src", "alt", "title", "class", "target", "rel"]);

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
    const safeAttrs = attrPart
      .split(/\s+/)
      .filter((p) => {
        const name = p.split("=")[0]?.toLowerCase();
        return name && ALLOWED_ATTRS.has(name);
      })
      .join(" ");
    return safeAttrs ? `<${tag} ${safeAttrs}>` : `<${tag}>`;
  });
  return out;
}
