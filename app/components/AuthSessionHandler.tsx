'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AUTH_UNAUTHORIZED_EVENT } from '@/global/types/api';
import { authenStore } from '@/app/store/user/loginAuthStore';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';

const LOGIN_PATH = '/auth/login';

/**
 * Listens for 401 / token-expired from the Axios layer (via custom event; no circular deps).
 * Clears auth and profile Zustand state, then redirects to login via Next.js router.
 * Must be mounted high in the tree (e.g. RootLayout) as a client component.
 */
export default function AuthSessionHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleUnauthorized = () => {
      authenStore.getState().clearAuthData();
      useUserProfileStore.getState().clearProfile();
      router.push(LOGIN_PATH);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [router]);

  return null;
}
