/** Min and max “paragraphs” of body text surfaced before checkout (deterministic per article id). */
const FREE_PREVIEW_PARAGRAPHS_MIN = 1;
const FREE_PREVIEW_PARAGRAPHS_MAX = 2;

/** If paragraph-based clipping still exposes more than ~this fraction of plain text vs full body, clamp harder. */
const MAX_PREVIEW_RATIO_OF_FULL_TEXT = 0.42;

function escapePlainForHtmlSnippet(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain-ish length ignoring tags (cheap estimate). */
function plainApproxLength(html: string): number {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
}

/** Stable per-article count in [min, max]. */
export function getFreePreviewParagraphCount(articleId: string): number {
  const n = FREE_PREVIEW_PARAGRAPHS_MAX - FREE_PREVIEW_PARAGRAPHS_MIN + 1;
  const hash = articleId.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return FREE_PREVIEW_PARAGRAPHS_MIN + (Math.abs(hash) % n);
}

function hasTextContent(htmlFragment: string): boolean {
  const text = htmlFragment.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return text.length >= 10;
}

/**
 * Returns the first N “text” paragraphs in `<p>…</p>`. Matches editor output from TipTap/ProseMirror.
 */
function takeFirstParagraphTagsHtml(html: string, n: number): string {
  const trimmed = (html || "").trim();
  if (!trimmed) return "";

  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let textParagraphCount = 0;
  let endIndex = 0;

  for (const m of trimmed.matchAll(pRegex)) {
    const fullMatch = m[0];
    const inner = m[1] || "";
    if (hasTextContent(inner)) {
      textParagraphCount++;
      endIndex = m.index! + fullMatch.length;
      if (textParagraphCount >= n) break;
    }
  }

  if (textParagraphCount >= n && endIndex > 0) {
    return trimmed.slice(0, endIndex);
  }

  if (textParagraphCount > 0) {
    return trimmed.slice(0, endIndex || trimmed.length);
  }

  const blocks = trimmed.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
  if (blocks.length > 0) {
    const firstN = blocks.slice(0, n);
    return firstN
      .map((block) => `<p>${block.trim().replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  const fallback = trimmed.slice(0, 1200).trim();
  return fallback ? `<p>${fallback.replace(/\n/g, "<br>")}</p>` : trimmed;
}

/**
 * When HTML uses few `<p>` tags, fall back to tiny plain excerpt so unpaid readers never inherit the whole blob.
 */
function truncatePlainTextSnippet(html: string, maxChars: number): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text.length) return "";
  if (text.length <= maxChars) {
    return `<p>${escapePlainForHtmlSnippet(text)}</p>`;
  }
  let cut = text.slice(0, maxChars);
  const sp = cut.lastIndexOf(" ");
  if (sp > maxChars * 0.55) {
    cut = cut.slice(0, sp);
  }
  return `<p>${escapePlainForHtmlSnippet(cut)}…</p>`;
}

/**
 * Builds safe preview HTML for readers without entitlement. Used server-side and can be mirrored client-side.
 */
export function buildArticlePreviewHtml(html: string, articleId: string): string {
  const full = (html || "").trim();
  if (!full) return "";

  const lnFullApprox = plainApproxLength(full);
  /** Server already clipped body for unpaid readers (~1–4 short paragraphs max). Avoid double-stripping. */
  if (lnFullApprox <= 960) {
    return full;
  }

  const n = getFreePreviewParagraphCount(articleId);
  const paragraphPreview = takeFirstParagraphTagsHtml(full, n);
  const lnFull = plainApproxLength(full);
  const lnPrev = plainApproxLength(paragraphPreview);

  const maxChars = Math.min(950, lnFull <= 2400 ? Math.floor(lnFull * 0.38) : 900);

  if (lnFull > 380 && lnPrev > lnFull * MAX_PREVIEW_RATIO_OF_FULL_TEXT) {
    return truncatePlainTextSnippet(full, maxChars);
  }

  return paragraphPreview;
}
