# Pre-Commit Security Scan Findings

Scan date: before push to GitHub. **Please review and confirm** which items you want to fix before any automatic deletion or refactor.

---

## 1. Sensitive Data & Private URLs

### 1.1 `config/env.ts` — Dev fallback URLs in code

| Location | Current value | Risk |
|----------|----------------|------|
| `devFallback.helpdeskApiUrl` | `'https://api-test.edl.com.la/helpdesk/api'` | Private/staging URL in repo |
| `devFallback.helpdeskUploadBaseUrl` | `'https://api-test.edl.com.la/helpdesk/upload/categoryicon'` | Same |
| `devFallback.appUrl` | `'http://localhost:3500'` | Low (local only) |
| `devFallback.ticketsApiUrl` | `'http://localhost:3501'` | Low |
| `devFallback.reportsApiUrl` | `'http://localhost:3000/api'` | Low |
| Line 83 (`helpdeskUploadRequestBaseUrl`) | `'https://api-test.edl.com.la/helpdesk/upload'` when `apiBase` empty + dev | Same as above |

**Recommendation:**  
- Use **empty string** for all non-localhost fallbacks in production.  
- For **development**, either: (a) require `.env.local` (no fallback URLs in code), or (b) keep only `localhost` fallbacks and document real URLs in `.env.example` only.

**Suggested change:** Remove `api-test.edl.com.la` from source; use `''` when env is unset. Document example values in `.env.example`.

---

### 1.2 `next.config.js` — Hardcoded image hostname

| Location | Current value |
|----------|----------------|
| `images.remotePatterns[0].hostname` | `'api-test.edl.com.la'` |
| `images.remotePatterns[1].hostname` | `'api-test.edl.com.la'` |

**Recommendation:** Read hostname from env, e.g. `process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAME`, and add that variable to `.env.example`. If unset, use empty or skip adding the pattern.

---

### 1.3 Layout files — Fallback app URL

| File | Line (approx) | Current |
|------|----------------|---------|
| `app/(main)/layout.tsx` | ~14 | `env.appUrl || 'http://localhost:3500'` |
| `app/(full-page)/layout.tsx` | ~10 | Same |
| `app/(HelpDesk-req)/layout.tsx` | ~14 | Same |

**Risk:** Low (localhost only).  
**Recommendation:** Optional. Could use `env.appUrl || ''` and handle empty in UI, or keep for local dev.

---

### 1.4 `Fake-DB.json` — Demo/sample data

Contains sample employee with `"email": "dal.som@edl.com.la"` and phone numbers.

**Risk:** Not a secret, but internal-looking data in repo.  
**Recommendation:** Optional. Replace with clearly fake data (e.g. `user@example.com`) if you want to avoid any real-looking PII.

---

### 1.5 No hardcoded API keys, passwords, or JWT tokens found

Scans did not find literal API keys, secrets, or tokens in source. Auth uses `process.env` / `config/env.ts` and token from store/localStorage at runtime.

---

## 2. Environment Variables

- **Current pattern:** All config goes through `config/env.ts` and `process.env` (and `.env.example` documents vars). Good.
- **Gap:** Default/fallback values in `config/env.ts` and `next.config.js` still contain real URLs/hostnames (see §1.1 and §1.2). Moving those to env-only (with examples only in `.env.example`) would align with “no real URLs in code”.

---

## 3. Debug Code (console / alerts)

### 3.1 `console.log` (remove or guard for production)

| File | Line (approx) | Context |
|------|----------------|---------|
| `app/(main)/uikit/GroupProblem/page.tsx` | 67 | `console.log("[GroupProblem] category item:", ...)` — already wrapped in `NODE_ENV === "development"` |
| `app/(main)/uikit/profileUser/page.tsx` | 15 | `console.log('[profileUser]', msg, ...)` |
| `app/(main)/uikit/profileUser/hooks/useProfile.ts` | 10 | `console.log('[profileUser]', ...)` |
| `config/env.ts` | 54, 62, 69 | `console.log('[env] helpdeskUploadBaseUrl ...')` — dev-only (inside `getIsDev()`) |
| `app/api/proxy-category-icon/route.ts` | 59, 71, 85, 116 | `console.log('[proxy-icon] ...')` — debug proxy |
| `app/store/user/userProfileStore.ts` | 174 | `const LOG = (msg, data) => { console.log(...) };` and its usages |
| `app/(main)/uikit/reportHD/service.ts` | 29 | `console.log('Request canceled:', error.message)` (inside catch for axios cancel) |

**Recommendation:**  
- Remove or guard all of the above for production (e.g. wrap in `if (process.env.NODE_ENV === 'development')` or remove).  
- Keep or replace `reportHD/service.ts` cancel log with a non-logging path (e.g. rethrow only) if you don’t want any log there.

### 3.2 `console.warn` (review)

| File | Line (approx) |
|------|----------------|
| `app/(main)/uikit/profileUser/page.tsx` | 38 |
| `app/(main)/uikit/MenuApps/Detail-category_Issues/IssuesIconTable.tsx` | 47 |
| `app/store/user/userProfileStore.ts` | 205, 233, 279 |
| `app/(main)/uikit/profileUser/hooks/useProfile.ts` | (same as page) |

**Recommendation:** Remove or replace with a proper logger that can be disabled or reduced in production.

### 3.3 `console.error` (review — often in catch blocks)

| File | Line (approx) | Context |
|------|----------------|---------|
| `app/(main)/uikit/reportHD/page.tsx` | 160 | `console.error(err)` in PDF export catch |
| `app/(main)/uikit/reportHD/hooks/useReportData.ts` | 44 | In catch |
| `app/(main)/uikit/reportHD/service.ts` | 33 | "Error fetching reports" |
| `app/api/proxy-category-icon/route.ts` | 104, 156, 158 | Proxy fetch errors |
| `app/store/user/userProfileStore.ts` | 292 | fetchUserProfile error |

**Recommendation:** Prefer a logger or error reporting service that does not log request/response details in production. If keeping `console.error` for now, ensure no secrets (tokens, URLs with keys) are logged.

### 3.4 `alert()`

- **None found** in the scanned codebase.

---

## 4. Commented-out code blocks

- Many files contain short comments (e.g. `// ສະຖານະ`) or JSDoc; no large blocks of commented-out logic were flagged as obvious “testing” leftovers.  
- If you want, we can do a second pass focused only on multi-line commented code (e.g. `/* ... */` or `// ...` over many lines) and list those for optional cleanup.

---

## 5. .gitignore check

Current `.gitignore` includes:

| Entry | Status |
|-------|--------|
| `/node_modules` | ✅ Present |
| `/.next/` | ✅ Present |
| `/out/` | ✅ Present |
| `/build` | ✅ Present |
| `.env` | ✅ Present |
| `.env*.local` | ✅ Present |
| `.env.development` / `.env.production` / `.env.test` | ✅ Present |
| `!.env.example` | ✅ Present (so .env.example is committed) |

**Verdict:** .gitignore is correctly set to avoid committing env files with secrets and build artifacts.

**Optional:** Add `.cursor/` if you do not want to commit Cursor/IDE metadata.

---

## 6. Summary table

| Category | Finding | Suggested action |
|----------|---------|------------------|
| Sensitive | Real URLs in `config/env.ts` (dev fallbacks + line 83) | Remove from code; use env-only, document in `.env.example` |
| Sensitive | Hostname in `next.config.js` | Move to env var (e.g. `NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAME`) |
| Sensitive | Layout fallback `localhost:3500` | Optional: keep for dev or replace with `env.appUrl \|\| ''` |
| Sensitive | `Fake-DB.json` sample email/phone | Optional: anonymize to e.g. `user@example.com` |
| Debug | Multiple `console.log` / `console.warn` | Remove or guard with `NODE_ENV === 'development'` |
| Debug | `console.error` in catch blocks | Keep short term; prefer logger and no secrets in logs |
| .gitignore | .env, node_modules, build dirs | No change needed |
| .gitignore | Optional | Add `.cursor/` if desired |

---

## 7. What I need from you

Please reply with:

1. **Sensitive data / URLs**  
   - Confirm you want: (a) all `api-test.edl.com.la` and real URLs removed from `config/env.ts` and `next.config.js`, and (b) layout fallbacks changed to empty string or left as localhost.

2. **Fake-DB.json**  
   - Keep as-is, or replace email/phone with fake data (e.g. `user@example.com`).

3. **Debug code**  
   - Remove all listed `console.log` (and optionally `console.warn`), or only those in app code (excluding `config/env.ts` and API routes if you still want dev logs there).  
   - For `console.error`: keep as-is for now, or replace with a small logger helper that no-ops in production.

4. **.gitignore**  
   - Add `.cursor/` (y/n).

5. **Commented-out code**  
   - Whether to run a second scan and list only multi-line commented blocks for optional deletion.

After you confirm, I will apply only the changes you approve (no deletion or refactor without your say-so).
