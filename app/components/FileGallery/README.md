# FileGallery

Display and download files (PDF and images) from your API.

## API Route: `/api/download`

- **Method:** GET  
- **Query:** `fileUrl` (required), `fileName` (optional)  
- Fetches the file from the external URL and returns it with `Content-Disposition: attachment` so the browser downloads it.  
- CORS: `Access-Control-Allow-Origin: *`  
- Only `http` and `https` URLs are allowed.

## FileGallery component

### Props

| Prop     | Type              | Description                                                                 |
|----------|-------------------|-----------------------------------------------------------------------------|
| `apiUrl` | `string`          | API URL to fetch file list (GET). Response: `FileGalleryItem[]` or `{ data: FileGalleryItem[] }`. |
| `files`  | `FileGalleryItem[]` | Pass the list directly (overrides `apiUrl`).                              |

### File item shape: `{ id, name, url, type }`

- `id`: number or string  
- `name`: display name  
- `url`: full URL to the file  
- `type`: `"image"` | `"pdf"` (optional; inferred from URL extension if missing)

### Usage

```tsx
// From API
<FileGallery apiUrl="/api/my-files" />

// With data
<FileGallery files={[
  { id: 1, name: "doc.pdf", url: "https://example.com/doc.pdf", type: "pdf" },
  { id: 2, name: "photo.jpg", url: "https://example.com/photo.jpg", type: "image" },
]} />
```

### Behaviour

- **Images:** Thumbnail with `<img>`.  
- **PDFs:** Placeholder + "Preview" (opens in modal iframe) and "Download".  
- **Download:** Links to `/api/download?fileUrl=...&fileName=...` to force download.  
- Loading and error states with Retry when using `apiUrl`.
