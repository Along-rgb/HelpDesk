# NPM Audit Updates and Refactor Notes

Summary of dependency updates applied to fix vulnerabilities, and code patterns that may need attention after upgrades.

---

## 1. Updates Applied

### 1.1 Non-breaking (safe version bumps)

| Package | Before | After | Vulnerability addressed |
|--------|--------|--------|--------------------------|
| **axios** | ^1.13.2 | ^1.13.6 | GHSA-43fc-jf86-j433 (High – DoS via `__proto__` in mergeConfig) |
| **next** | ^16.1.2 | ^16.1.6 | GHSA-9g9p-9gw9-jx7f (High – Image Optimizer DoS), GHSA-h25m-26qc-wcjf, GHSA-5f7q-jpqc-wp7h |
| **eslint-config-next** | ^16.1.2 | ^16.1.6 | Aligned with Next.js |
| **lodash-es** | (transitive) | ^4.17.23 (direct + override) | GHSA-xxjr-mmjv-4gpg (Moderate – prototype pollution in `_.unset`/`_.omit`) |
| **minimatch** | (transitive) | ^9.0.7 (override) | ReDoS issues in older 3.x / 5.x / 9.0.0–9.0.6 |

### 1.2 Breaking / major changes

| Package | Before | After | Notes |
|--------|--------|--------|--------|
| **html2pdf.js** | ^0.10.3 | ^0.14.0 | Fixes Critical XSS (GHSA-w8x4-x68c-m6fc) and pulls in patched jspdf. API used in this project (`.set().from().save()`) remains supported. |
| **quill** | ^2.0.3 | 2.0.2 (pinned) | XSS in HTML export (GHSA-v3m3-f69x-jf25). No fixed 2.0.3+ release yet; downgraded to 2.0.2 as suggested by audit. |

### 1.3 Overrides (package.json)

- **lodash-es**: `^4.17.23` – forces all dependents (e.g. quill) to use a safe version.
- **minimatch**: `^9.0.7` – forces transitive dependents off vulnerable 3.x / 5.x / 9.0.0–9.0.6.

### 1.4 Other fix

- **ajv**: Resolved by `npm audit fix` (transitive dependency).

---

## 2. Files Using Updated Libraries

### 2.1 html2pdf.js

| File | Usage |
|------|--------|
| `app/(main)/uikit/reportHD/page.tsx` | Dynamic import: `(await import('html2pdf.js')).default`; then `html2pdf().set({...}).from(el).save()` for PDF export. |

No other files reference html2pdf.

### 2.2 quill

- **No direct usage** in app or layout code. It is a direct dependency in `package.json` (likely for a rich-text/editor component or future use). PrimeReact’s Editor can use Quill; if you add such a component later, use it with sanitized content only.

### 2.3 axios

| File | Usage |
|------|--------|
| `config/axiosClientsHelpDesk.ts` | `import axios`; creates default Helpdesk client with interceptors. |
| `config/createAuthAxios.ts` | `import axios`; creates authenticated instances. |
| `app/(main)/uikit/reportHD/service.ts` | `import axios`; raw `axios.get()` for reports API (no 401 handling). |
| `app/store/user/usersStore.ts` | `import type { AxiosResponse } from 'axios'` (types only). |

All other API calls go through `axiosClientsHelpDesk` or `createAuthAxios` (re-exports of the same axios API).

### 2.4 next

Used across the app in the usual way:

- **Routing / navigation**: `next/navigation` – `useRouter`, `usePathname`, `useSearchParams`, `Link`.
- **Server/API**: `next/server` – `NextRequest`, `NextResponse` (e.g. `app/api/proxy-helpdesk/[...path]/route.ts`, `app/api/proxy-category-icon/route.ts`, `app/api/upload-category-icon/route.ts`).
- **Metadata**: `next` – `Metadata` (e.g. in `app/(main)/layout.tsx`, `app/(full-page)/layout.tsx`).
- **Documentation (demo snippet only)**: `app/(main)/documentation/page.tsx` contains a string that mentions `import Head from 'next/head'` – this is sample code only; in App Router, metadata is set via the `metadata` export, not `Head`.

### 2.5 lodash-es / minimatch

- No direct imports in this repo. Both are consumed only as transitive dependencies; versions are forced via overrides above.

---

## 3. Code Patterns That Might Break and Refactor Suggestions

### 3.1 html2pdf.js (0.10 → 0.14)

- **Current pattern**: `(await import('html2pdf.js')).default` then `html2pdf().set().from().save()`.
- **Risk**: Low. The public API for the worker chain (`.set()`, `.from()`, `.save()`) is unchanged in 0.14. If a future version drops default export, the dynamic import would need to be adjusted (e.g. use a named export or the package’s documented entry).
- **Refactor (only if needed)**:
  - If `.default` is undefined at runtime, try:  
    `const html2pdf = (await import('html2pdf.js')).default ?? (await import('html2pdf.js')).html2pdf;`
  - Keep options as-is; 0.14 still supports `margin`, `filename`, `image`, `html2canvas`, `jsPDF` in `.set()`.

### 3.2 quill (2.0.3 → 2.0.2)

- **Current usage**: None in source; only in dependency tree.
- **Risk**: If you later add a component that uses Quill (e.g. PrimeReact Editor with Quill), be aware that 2.0.2 may still have XSS concerns when rendering exported HTML.
- **Refactor suggestion**: For any future use of Quill’s `getSemanticHTML()` / `getHTML()` or similar, **do not** inject the result into the DOM with `dangerouslySetInnerHTML` without sanitizing (e.g. with DOMPurify), or render as plain text where possible.

### 3.3 Next.js (16.1.2 → 16.1.6)

- **Risk**: Patch release; no intentional breaking changes. Image Optimizer and PPR/resume behavior may have small behavior fixes.
- **Refactor**: None required. If you use `remotePatterns` for images, the DoS fix may enforce stricter limits; only refactor if you see new errors or limits in production.

### 3.4 axios (1.13.2 → 1.13.6)

- **Risk**: None for typical usage; fix only tightens `mergeConfig` against malicious `__proto__` keys.
- **Refactor**: None. All current uses (create, interceptors, `axios.get`, types) remain valid.

### 3.5 reportHD/service.ts – raw axios

- **Pattern**: Uses raw `axios.get()` against `env.reportsApiUrl`; no shared 401/403 interceptors.
- **Suggestion**: For consistency and automatic session-clear on 401, consider switching to an authenticated client (e.g. `createAuthAxios(env.reportsApiUrl)` or a dedicated reports client with the same interceptors as Helpdesk). Optional refactor, not required for the audit.

### 3.6 Documentation page – `next/head` in snippet

- **File**: `app/(main)/documentation/page.tsx` (string content showing `import Head from 'next/head'`).
- **Risk**: None; it’s demo text. App Router uses `metadata` export, not `Head`.
- **Refactor (optional)**: Update the snippet to show App Router metadata example instead of `Head`, to avoid misleading readers.

---

## 4. Verification

- `npm audit` after updates and `npm audit fix`: **0 vulnerabilities**.
- `npm run build`: **success** (Next.js 16.1.6, Turbopack).

A single pre-existing code bug was fixed during the build: `useTicketTable.ts` still referenced `getUpdateHelpdeskStatusPath` in one place; it was updated to `HELPDESK_ENDPOINTS.updateHelpdeskStatus(id)`.

---

## 5. Summary Table

| Area | Action |
|------|--------|
| **Security** | axios, next, html2pdf.js, quill, lodash-es, minimatch, ajv updated or overridden to address reported vulnerabilities. |
| **html2pdf.js** | One file uses it; API unchanged; no code change required. |
| **quill** | Not used in code; downgraded to 2.0.2; sanitize any future HTML export usage. |
| **Breaking changes** | None observed for current usage; quill 2.0.2 is a downgrade for security only. |
| **Refactors** | Optional: use authenticated axios in reportHD/service; clarify documentation snippet for App Router. |
