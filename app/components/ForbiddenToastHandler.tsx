'use client';

import { useRef, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { AUTH_FORBIDDEN_TOAST_EVENT, AUTH_FORBIDDEN_MSG } from '@/global/types/api';

const FORBIDDEN_MESSAGE_ID = 'forbidden-403';

/**
 * ฟังเหตุการณ์ 403 จาก Axios → แสดง toast สีแดง (ข้อความจาก AUTH_FORBIDDEN_MSG)
 * ไม่ดีดผู้ใช้ออก — ให้เขายังดูข้อมูลส่วนอื่นที่ดูได้อยู่
 */
export default function ForbiddenToastHandler() {
  const toastRef = useRef<Toast>(null);

  useEffect(() => {
    const handleForbidden = (e: Event) => {
      const message = (e as CustomEvent<{ message?: string }>).detail?.message ?? AUTH_FORBIDDEN_MSG;
      toastRef.current?.clear();
      toastRef.current?.show({
        id: FORBIDDEN_MESSAGE_ID,
        severity: 'error',
        summary: 'ແຈ້ງເຕືອນ',
        detail: message,
        life: 5000,
      });
    };

    window.addEventListener(AUTH_FORBIDDEN_TOAST_EVENT, handleForbidden);
    return () => window.removeEventListener(AUTH_FORBIDDEN_TOAST_EVENT, handleForbidden);
  }, []);

  return <Toast ref={toastRef} position="top-center" />;
}
