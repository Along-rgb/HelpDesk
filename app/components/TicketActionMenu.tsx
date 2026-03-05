'use client';

import React from 'react';
import { SplitButton } from 'primereact/splitbutton';
import { useRouter } from 'next/navigation';
import { encryptId } from '@/lib/crypto';

export interface TicketActionMenuItem {
  label: string;
  icon: string;
  className?: string;
  command: () => void;
  disabled?: boolean;
}

export interface TicketActionMenuProps {
  /** Ticket หรือ object ที่มี id สำหรับไปหน้ารายละเอียด */
  ticket: { id: string | number };
  /** หน้าต่าง: techn = ปุ่มແກ້ໄຂແລ້ວ/ປິດວຽກ/ຍົກເລີກ, user = ການສົນທະນາ/ປິດ/ຍົກເລີກ */
  variant?: 'techn' | 'user';
  /** เมนูเพิ่มเติม (ถ้าไม่ส่ง ใช้ค่า default ตาม variant) */
  menuItems?: TicketActionMenuItem[];
}

const DEFAULT_ITEMS_TECHN: TicketActionMenuItem[] = [
  { label: 'ແກ້ໄຂແລ້ວ', icon: 'pi pi-check', command: () => {} },
  { label: 'ປິດວຽກ', icon: 'pi pi-times-circle', command: () => {} },
  { label: 'ຍົກເລີກ', icon: 'pi pi-trash', className: 'text-red-500', command: () => {} },
];

const DEFAULT_ITEMS_USER: TicketActionMenuItem[] = [
  { label: 'ການສົນທະນາ', icon: 'pi pi-comments', command: () => {} },
  { label: 'ປິດ', icon: 'pi pi-check-circle', command: () => {} },
  { label: 'ຍົກເລີກ', icon: 'pi pi-times-circle', className: 'text-red-500', command: () => {} },
];

export function TicketActionMenu({
  ticket,
  variant = 'techn',
  menuItems,
}: TicketActionMenuProps) {
  const router = useRouter();
  const items = menuItems ?? (variant === 'user' ? DEFAULT_ITEMS_USER : DEFAULT_ITEMS_TECHN);
  const model = items.map((item) => ({
    label: item.label,
    icon: item.icon,
    className: item.className,
    command: item.command,
    disabled: item.disabled,
  }));

  const isUser = variant === 'user';
  const buttonStyle = isUser
    ? { height: '26px' as const, padding: '0px 12px' as const, fontSize: '1rem' as const }
    : { height: '28px' as const, fontSize: '12px' as const, padding: '0px 8px' as const };
  const menuButtonWidth = isUser ? '25px' : '24px';

  return (
    <div className="flex justify-content-center">
      <SplitButton
        label="ລາຍລະອຽດ"
        icon="pi pi-file"
        model={model}
        className={isUser ? 'p-button-secondary p-button-sm custom-splitbutton-xs' : 'p-button-secondary p-button-sm'}
        style={isUser ? { height: '26px' } : { height: '28px', fontSize: '12px' }}
        buttonProps={{ style: buttonStyle }}
        menuButtonProps={{ style: { width: menuButtonWidth, padding: isUser ? '0' : undefined } }}
        onClick={() => router.push(`/uikit/ticket-detail/${encryptId(ticket.id)}`)}
        dropdownIcon="pi pi-chevron-down"
      />
    </div>
  );
}
