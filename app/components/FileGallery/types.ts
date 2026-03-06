export interface FileGalleryItem {
  id: number | string;
  name: string;
  url: string;
  type: "image" | "pdf";
}

export interface FileGalleryProps {
  /** API URL to fetch file list (GET). Response should be FileGalleryItem[] or { data: FileGalleryItem[] }. */
  apiUrl?: string;
  /** Or pass the file list directly (takes precedence over apiUrl). */
  files?: FileGalleryItem[];
}
