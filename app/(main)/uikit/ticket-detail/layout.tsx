'use client';

import React from 'react';
import { useTicketDetailAccess } from '@/app/hooks/useTicketDetailAccess';

/**
 * Layout ສຳລັບ ticket-detail — ອະນຸຍາດໃຫ້ Role 1, 2, 3, 4 (SuperAdmin, Admin, Staff, User) ເຂົ້າໄດ້.
 * ບໍ່ມີ role ຈະຖືກ redirect ໄປ profile.
 */
export default function TicketDetailLayout({ children }: { children: React.ReactNode }) {
  const { loading, allowed } = useTicketDetailAccess('/uikit/profileUser');

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center p-8">
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }} />
      </div>
    );
  }
  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
