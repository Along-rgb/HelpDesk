'use client';

import React, { useState, useEffect } from 'react';

/**
 * ใช้กับ UI ที่อ่านจาก Zustand store ที่มี persist middleware (เช่น authenStore)
 * เพื่อหลีกเลี่ยง Hydration Mismatch: Server ไม่มี localStorage จึงได้ state ต้นทาง
 * เมื่อ Client rehydrate ค่าจะเปลี่ยน → HTML ไม่ตรงกัน
 *
 * วิธีใช้:
 * - คืน true หลัง client mount (และ persist rehydrate แล้ว) จึงปลอดภัยที่จะแสดงค่าจาก store
 * - ก่อน hydrated ให้ return null หรือ Skeleton แทนการแสดงค่าจาก store
 *
 * @example
 * const hasHydrated = useStoreHydration();
 * const authData = authenStore(s => s.authData);
 * if (!hasHydrated) return <div className="animate-pulse h-8 w-32" />;
 * return authData ? <UserMenu /> : <LoginButton />;
 */
export function useStoreHydration(): boolean {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}

interface StoreHydrationGateProps {
  children: React.ReactNode;
  /** แสดงก่อน rehydrate (เช่น null หรือ Skeleton) */
  fallback?: React.ReactNode;
}

/**
 * Wrapper สำหรับส่วนที่อ่านจาก persist store — แสดง children หลัง client hydration เท่านั้น
 * ใช้แทนการเช็ค useStoreHydration ในหลายที่
 */
export function StoreHydrationGate({ children, fallback = null }: StoreHydrationGateProps): React.ReactNode {
  const hasHydrated = useStoreHydration();
  if (!hasHydrated) return fallback;
  return <>{children}</>;
}
