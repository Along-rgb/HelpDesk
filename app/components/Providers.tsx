'use client';

import React from 'react';
import ClientHydration from './ClientHydration';
import AuthSessionHandler from './AuthSessionHandler';
import ForbiddenToastHandler from './ForbiddenToastHandler';
import { LayoutProvider } from '@/layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-only wrapper that bundles all providers and global handlers.
 * Extracted from RootLayout so that app/layout.tsx can remain a Server Component,
 * which allows Next.js to stream the outer <html>/<head> shell immediately.
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    <ClientHydration>
      <PrimeReactProvider>
        <LayoutProvider>
          <AuthSessionHandler />
          <ForbiddenToastHandler />
          {children}
        </LayoutProvider>
      </PrimeReactProvider>
    </ClientHydration>
  );
}
