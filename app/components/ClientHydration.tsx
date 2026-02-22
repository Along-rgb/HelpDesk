'use client';

import React, { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

interface ClientHydrationProps {
  children: React.ReactNode;
}

/**
 * Wraps children so they only render after mount.
 * Shows LoadingScreen until then to prevent Zustand/store hydration mismatches.
 * Use at the root layout to keep the rest of the app clean.
 */
export default function ClientHydration({ children }: ClientHydrationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
