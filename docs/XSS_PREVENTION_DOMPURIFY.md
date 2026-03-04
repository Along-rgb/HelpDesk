# XSS Prevention with DOMPurify

This project uses **DOMPurify** to sanitize HTML before rendering, preventing XSS from user/API content, Quill editor output, and content that may be captured for PDFs.

## Packages

- **dompurify** (dependency)
- **@types/dompurify** (devDependency)

Already installed; no extra install needed.

## Utilities (`utils/sanitizeHtml.ts`)

| Function | Use case | Next.js |
|----------|----------|---------|
| **sanitizeHtml(dirty, allowedTags?)** | User/API/Quill HTML for `dangerouslySetInnerHTML` | SSR: strips all tags; client: DOMPurify with allow list |
| **sanitizeStyleContent(dirty)** | Inline `<style>` content (e.g. tooltip CSS) | SSR: strips `<script>` only; client: DOMPurify allows only `style` |

Both are safe to call from Client or Server components; DOMPurify runs only in the browser.

## Where We Sanitize

### 1. User/API HTML (rich text)

- **`app/(main)/uikit/ticket-detail/[id]/page.tsx`**  
  Ticket description from API: `sanitizeHtml(ticket.description)` before `dangerouslySetInnerHTML`.

### 2. Inline style (tooltip CSS)

- **`app/(main)/uikit/table/page.tsx`**  
  `CUSTOM_TOOLTIP_CSS`: `sanitizeStyleContent(CUSTOM_TOOLTIP_CSS)`.
- **`app/(main)/uikit/pageTechn/page.tsx`**  
  Same for local `CUSTOM_TOOLTIP_CSS`.
- **`app/(main)/uikit/request-history/page.tsx`**  
  Same for `CUSTOM_TOOLTIP_CSS` from table constants.

### 3. Quill editor (future)

There is **no Quill usage in the app yet**. When you add a rich-text editor (e.g. PrimeReact Editor with Quill):

- Never pass **Quill’s `getHTML()` or `getSemanticHTML()`** straight into `dangerouslySetInnerHTML`.
- Always sanitize first:
  ```ts
  import { sanitizeHtml } from '@/utils/sanitizeHtml';
  const safeHtml = sanitizeHtml(quillRef.current?.root?.innerHTML ?? '');
  // or: sanitizeHtml(quill.getSemanticHTML());
  ```
- If you only need plain text, prefer `getText()` and render as text.

### 4. PDF (html2pdf)

- **`app/(main)/uikit/reportHD/page.tsx`**  
  PDF is generated from the DOM of `printableAreaRef`. Report data is currently plain text (no HTML cells).  
- If you later render **HTML from user/API** inside that area (e.g. a cell with rich text), sanitize that HTML with **sanitizeHtml()** before putting it in the DOM so html2pdf does not capture unsanitized content.

## Rule of thumb

- Any string that comes from **user input**, **API**, or **Quill** and is rendered with **`dangerouslySetInnerHTML`** must be passed through **sanitizeHtml()** (or **sanitizeStyleContent()** for style-only content).
- For static, app-controlled strings (e.g. constants), we still run them through the sanitizers for consistency and to protect against mistaken use of dynamic content later.
