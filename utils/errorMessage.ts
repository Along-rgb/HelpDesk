/**
 * Extract user-facing error message from API/client errors.
 * Do not log secrets or full response bodies.
 */

export function getApiErrorMessage(
  error: unknown,
  fallback: string = 'ເກີດຂໍ້ຜິດພາດ'
): string {
  if (error == null) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: { message?: string } } }).response;
    const msg = res?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }
  return fallback;
}
