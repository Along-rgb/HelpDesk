# Backend: Static File Serving for Uploads & URL Mapping

Frontend expects images at: **`{API_ORIGIN}/helpdesk/uploads/{filename}`**  
(e.g. `https://api-test.edl.com.la/helpdesk/uploads/1771920010070-925747134.png`).

Backend must:
1. Save uploaded files to a single `uploads` directory (using `path.join(__dirname, '..', 'uploads')`).
2. Serve that directory at **`/helpdesk/uploads`** (or consistently at `/uploads` if frontend env matches).
3. Return only the **filename** in API response (e.g. `catIcon: "1771920010070-925747134.png"`); frontend builds the full URL.
4. Send CORS headers for GET requests to the uploads path so the browser can load images.

---

## 1. Express: Static serving + Multer

```ts
// app.ts or server entry
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS for API and for static uploads (so <img> can load cross-origin)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// API routes under /helpdesk/api
app.use('/helpdesk/api', apiRouter);

// Static uploads: serve at /helpdesk/uploads (same origin as API)
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/helpdesk/uploads', express.static(uploadsDir));

app.listen(process.env.PORT || 3000);
```

**Multer: save to same directory**

```ts
// uploads/multer.config.ts or in categoryicons controller
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads');

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const ext = path.extname(file.originalname) || '.png';
      cb(null, `${unique}${ext}`);
    },
  }),
});

// In categoryicons controller (POST):
// form field name: catlcon (or catIcon — must match frontend FORM_KEY_ICON)
// Save to DB only the filename (e.g. 1771920010070-925747134.png).
// Return in response: { id, catIcon: filename, ... } — do NOT return full URL; frontend builds it.
```

**Return correct value in API response**

- GET `/helpdesk/api/categoryicons` → `[{ id: 1, catIcon: "1771920010070-925747134.png", ... }]`
- Do **not** return `catIcon: "https://.../uploads/..."`; return only the filename so the frontend can use `NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL` (or derived base) and stay env-driven.

---

## 2. NestJS: ServeStaticModule + Multer

**main.ts** — CORS for API and static (if you serve static from same app):

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

**app.module.ts** — serve uploads at `/helpdesk/uploads`:

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CategoryIconsModule } from './categoryicons/categoryicons.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/helpdesk/uploads',
    }),
    CategoryIconsModule,
    // ...
  ],
})
export class AppModule {}
```

**Multer: save to same directory**

```ts
// categoryicons/categoryicons.controller.ts (or upload.service)
import { Controller, Post, Put, UseInterceptors, UploadedFile, Body, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { editFileName } from './editFileName'; // see below

const uploadDir = join(__dirname, '..', '..', 'uploads');

@Controller('helpdesk/api/categoryicons')
export class CategoryIconsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('catlcon', {  // or 'catIcon' — must match frontend
      storage: diskStorage({
        destination: uploadDir,
        filename: editFileName,
      }),
    }),
  )
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const filename = file?.filename ?? null;
    // Save to DB only filename (e.g. "1771920010070-925747134.png")
    return this.service.create({ ...body, catIcon: filename });
  }
}
```

```ts
// editFileName.ts
import { extname } from 'path';

export const editFileName = (_req: any, file: Express.Multer.File, cb: (err: Error | null, name: string) => void) => {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const ext = extname(file.originalname) || '.png';
  cb(null, `${unique}${ext}`);
};
```

**path.join(__dirname, '../uploads')**

- In Nest, compiled output is often under `dist/`, so from a file `dist/categoryicons/categoryicons.controller.js`, `join(__dirname, '..', '..', 'uploads')` points to project root `uploads/`.
- Ensure the `uploads` folder exists at runtime (create on bootstrap or use a script). Example:

```ts
// In main.ts or a dedicated bootstrap service
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const uploadsPath = join(__dirname, '..', 'uploads');
if (!existsSync(uploadsPath)) {
  mkdirSync(uploadsPath, { recursive: true });
}
```

**Return value**

- Persist and return only the filename in `catIcon`. Frontend builds full URL as `${NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL}/${catIcon}` (e.g. `https://api-test.edl.com.la/helpdesk/uploads/1771920010070-925747134.png`).

---

## 3. Frontend URL mapping (this repo)

- **Env:** `NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL` = base for images (e.g. `https://api-test.edl.com.la/helpdesk/uploads`). No trailing slash.
- **Fallback:** If empty, frontend can derive from `NEXT_PUBLIC_HELPDESK_API_BASE_URL` by replacing `/api` with `/uploads` (e.g. `.../helpdesk/api` → `.../helpdesk/uploads`).
- **Usage:** `getCategoryIconFullUrl(filename)` in `app/(main)/uikit/MenuApps/utils/iconUrl.ts` builds `${uploadBaseUrl}/${filename}`. Use this for all category icon `<img src={...}>`.

---

## 4. Checklist

| Item | Backend | Frontend |
|------|--------|----------|
| Static path | Serve `uploads` at `/helpdesk/uploads` | — |
| Multer dest | `path.join(__dirname, '..', 'uploads')` (or `.., '..', 'uploads'` from dist) | — |
| API response | Return `catIcon: "filename.png"` only | Build full URL with `getCategoryIconFullUrl(catIcon)` |
| CORS | Allow GET for `/helpdesk/uploads` (or set globally) | — |
| Env | — | `NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL` = `https://.../helpdesk/uploads` |
