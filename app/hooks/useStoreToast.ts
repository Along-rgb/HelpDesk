/**
 * แสดง Toast จาก Store (error / successMessage) และ clear หลังแสดง
 * ใช้กับ helpdesk stores ที่มี error, successMessage, clearMessages
 */

import { useEffect, useRef, type RefObject } from 'react';
import type { Toast } from 'primereact/toast';

export interface StoreToastState {
  error: string;
  successMessage: string;
  clearMessages: () => void;
}

const DEFAULT_LIFE = 4000;

/**
 * Subscribe to store error/successMessage and show toast; then clear messages.
 * ໃຊ້ ref ເກັບ clearMessages ເພື່ອໃຫ້ effect ໃຊ້ແຕ່ error/successMessage ເປັນ dependency — ຫຼີກລ່ຽງ re-run ເມື່ອ clearMessages ປ່ຽນ reference.
 */
export function useStoreToast(
  toastRef: RefObject<Toast | null>,
  state: StoreToastState
): void {
  const { error, successMessage, clearMessages } = state ?? {};
  const clearMessagesRef = useRef(clearMessages);
  clearMessagesRef.current = clearMessages;

  useEffect(() => {
    if (!error?.trim()) return;
    toastRef.current?.show({
      severity: 'error',
      summary: 'Error',
      detail: error,
      life: DEFAULT_LIFE,
    });
    clearMessagesRef.current?.();
  }, [error, toastRef]);

  useEffect(() => {
    if (!successMessage?.trim()) return;
    toastRef.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: successMessage,
      life: DEFAULT_LIFE,
    });
    clearMessagesRef.current?.();
  }, [successMessage, toastRef]);
}
