/**
 * Shared confirm-delete dialog utility.
 * Wraps PrimeReact's confirmDialog with consistent Lao labels,
 * eliminating copy-paste across Buildings, Issues, and SupportTeam pages.
 *
 * Usage:
 *   import { showConfirmDelete } from '@/utils/confirmDeleteDialog';
 *   showConfirmDelete({ displayName: row.name, onAccept: () => deleteItem(row) });
 */
import { confirmDialog } from 'primereact/confirmdialog';

export interface ConfirmDeleteOptions {
  /** Name shown in the confirmation message */
  displayName: string;
  /** Custom message — overrides the default "ທ່ານຕ້ອງການລົບ ..." template */
  message?: string;
  /** Custom header — default: 'ຢືນຢັນການລົບ' */
  header?: string;
  /** Callback executed when user confirms deletion */
  onAccept: () => void | Promise<void>;
  /** Optional callback when user cancels */
  onReject?: () => void;
}

/**
 * Show a PrimeReact confirm dialog for deleting an item.
 * Requires `<ConfirmDialog />` to be mounted in the calling component tree.
 */
export function showConfirmDelete({
  displayName,
  message,
  header,
  onAccept,
  onReject,
}: ConfirmDeleteOptions): void {
  confirmDialog({
    message: message ?? `ທ່ານຕ້ອງການລົບ "${displayName}" ແທ້ບໍ່?`,
    header: header ?? 'ຢືນຢັນການລົບ',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'ຕົກລົງ',
    rejectLabel: 'ຍົກເລີກ',
    acceptClassName: 'p-button-danger',
    accept: onAccept,
    reject: onReject,
  });
}
