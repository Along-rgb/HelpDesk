import React from 'react';

/**
 * Skeleton placeholder for table-heavy pages (ticket list, admin, technician, report, etc.).
 * Uses only PrimeFlex classes — no extra CSS required.
 * Renders a fake toolbar + 6 shimmer rows to reduce perceived load time.
 */
export default function TablePageSkeleton() {
  return (
    <div className="card p-4 surface-card border-round">
      {/* Toolbar skeleton */}
      <div className="flex justify-content-between align-items-center mb-4">
        <div className="flex gap-2">
          <div className="surface-200 border-round" style={{ width: '10rem', height: '2.25rem' }} />
          <div className="surface-200 border-round" style={{ width: '12rem', height: '2.25rem' }} />
        </div>
        <div className="surface-200 border-round" style={{ width: '14rem', height: '2.25rem' }} />
      </div>

      {/* Table header skeleton */}
      <div className="flex gap-2 mb-2 px-2">
        {[4, 18, 10, 10, 8, 8].map((w, i) => (
          <div key={i} className="surface-300 border-round" style={{ width: `${w}%`, height: '1rem' }} />
        ))}
      </div>

      {/* Table rows skeleton */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-2 py-3 px-2 border-bottom-1 surface-border">
          {[4, 18, 10, 10, 8, 8].map((w, j) => (
            <div key={j} className="surface-200 border-round" style={{ width: `${w}%`, height: '0.85rem' }} />
          ))}
        </div>
      ))}
    </div>
  );
}
