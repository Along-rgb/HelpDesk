"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { FileGalleryItem, FileGalleryProps } from "./types";
import styles from "./FileGallery.module.scss";
import { getDownloadApiUrl } from "@/utils/downloadFile";

function normalizeList(data: unknown): FileGalleryItem[] {
  if (Array.isArray(data)) return data as FileGalleryItem[];
  if (data && typeof data === "object" && "data" in data) {
    const d = (data as { data: unknown }).data;
    if (Array.isArray(d)) return d as FileGalleryItem[];
  }
  return [];
}

function isImageType(type: string): boolean {
  const t = type?.toLowerCase();
  return t === "image" || t === "image/png" || t === "image/jpeg" || t === "image/jpg" || t === "image/gif" || t === "image/webp";
}

function isPdfType(type: string): boolean {
  return type?.toLowerCase() === "pdf" || type?.toLowerCase() === "application/pdf";
}

function inferType(item: { url?: string; type?: string }): "image" | "pdf" {
  if (item.type) {
    if (isImageType(item.type)) return "image";
    if (isPdfType(item.type)) return "pdf";
  }
  const url = (item.url ?? "").toLowerCase();
  if (/\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(url)) return "image";
  if (/\.pdf(\?|$)/i.test(url)) return "pdf";
  return "pdf";
}

export function FileGallery({ apiUrl, files: filesProp }: FileGalleryProps) {
  const [files, setFiles] = useState<FileGalleryItem[]>([]);
  const [loading, setLoading] = useState(!!apiUrl);
  const [error, setError] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<FileGalleryItem | null>(null);

  const loadFiles = useCallback(async () => {
    if (!apiUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = normalizeList(data).map((item) => ({
        ...item,
        type: inferType(item) as "image" | "pdf",
      }));
      setFiles(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    if (filesProp != null) {
      setFiles(
        filesProp.map((item) => ({
          ...item,
          type: item.type ?? inferType(item),
        }))
      );
      setLoading(false);
      setError(null);
      return;
    }
    if (apiUrl) loadFiles();
    else setFiles([]);
  }, [apiUrl, filesProp, loadFiles]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <span>Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error} role="alert">
        <p>Error loading files</p>
        <p>{error}</p>
        {apiUrl && (
          <button type="button" onClick={loadFiles} className={styles.retry}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className={styles.empty}>
        No files to display.
      </div>
    );
  }

  return (
    <>
      <div className={styles.wrapper}>
        {files.map((item) => (
          <div key={String(item.id)} className={styles.card}>
            <div className={styles.thumb}>
              {item.type === "image" ? (
                <Image
                  src={getDownloadApiUrl(item.url, item.name, "inline")}
                  alt={item.name}
                  width={300}
                  height={200}
                  className={styles.thumbImg}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  unoptimized
                />
              ) : (
                <div className={styles.thumbPdf}>PDF</div>
              )}
            </div>
            <p className={styles.name} title={item.name}>
              {item.name}
            </p>
            <div className={styles.actions}>
              {item.type === "pdf" && (
                <button
                  type="button"
                  onClick={() => setPreviewPdf(item)}
                  className={styles.btnPreview}
                >
                  Preview
                </button>
              )}
              <a
                href={getDownloadApiUrl(item.url, item.name, "attachment")}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnDownload}
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>

      {previewPdf && (
        <div
          className={styles.overlay}
          onClick={() => setPreviewPdf(null)}
          role="dialog"
          aria-modal="true"
          aria-label="PDF preview"
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>{previewPdf.name}</span>
              <button
                type="button"
                onClick={() => setPreviewPdf(null)}
                className={styles.modalClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <iframe
              src={previewPdf.url}
              title={previewPdf.name}
              className={styles.modalIframe}
            />
          </div>
        </div>
      )}
    </>
  );
}
