/**
 * Sanitize HTML before rendering to prevent XSS.
 * Safe for Next.js: use in both Client and Server components; DOMPurify runs only in the browser.
 *
 * - User/API/Quill content: use sanitizeHtml() before dangerouslySetInnerHTML.
 * - Inline <style> content: use sanitizeStyleContent() for style tags (e.g. tooltip CSS).
 * - PDF: sanitize any HTML that is rendered into the DOM before html2pdf captures it.
 */

import DOMPurify from 'dompurify';

/** Allowed tags for rich text (e.g. ticket description, Quill output). Script/style removed by DOMPurify. */
const DEFAULT_ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'span', 'div'];

/**
 * Sanitizes HTML for use in __html (e.g. ticket description, or Quill getHTML()/getSemanticHTML() output).
 * Next.js: on the server (SSR) we strip all tags; in the client we use DOMPurify.
 */
export function sanitizeHtml(
  dirty: string | undefined | null,
  allowedTags: string[] = DEFAULT_ALLOWED_TAGS
): string {
  if (dirty == null || String(dirty).trim() === '') return '';
  if (typeof window === 'undefined') return String(dirty).replace(/<[^>]*>/g, ''); // SSR: no DOM, strip tags
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: allowedTags });
}

/**
 * Sanitizes content that may contain a <style> tag (e.g. CUSTOM_TOOLTIP_CSS).
 * Use for any HTML passed to dangerouslySetInnerHTML that is primarily CSS.
 * Next.js: on the server we remove script tags only; in the client we allow only the style tag.
 */
export function sanitizeStyleContent(dirty: string | undefined | null): string {
  if (dirty == null || String(dirty).trim() === '') return '';
  if (typeof window === 'undefined') {
    return String(dirty).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''); // SSR: strip script only
  }
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ['style'] });
}
