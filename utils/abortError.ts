/**
 * Check if error is from AbortController (request cancelled).
 * Use in store fetch catch to skip setting error state on cancel.
 */

export function isAbortError(e: unknown): boolean {
  if (e == null || typeof e !== 'object') return false;
  const err = e as { name?: string; code?: string };
  return err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED';
}
