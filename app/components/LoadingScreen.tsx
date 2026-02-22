'use client';

import React from 'react';

/**
 * Minimal loading UI shown until client has mounted.
 * Used by ClientHydration to avoid hydration mismatches.
 */
export default function LoadingScreen() {
  return (
    <div className="layout-loading flex align-items-center justify-content-center min-h-screen">
      <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }} aria-hidden />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
