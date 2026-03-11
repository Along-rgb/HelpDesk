'use client';

import React from 'react';

/**
 * โหลดแบบมินิมอล — แสดงครั้งเดียว ເພື່ອບໍ່ລົບກວນຜູ້ໃຊ້.
 * ໃຊ້ໃນຫນ້າທີ່ຕ້ອງລໍຖ້າຂໍ້ມູນ (ticket-detail, profile ແລະອື່ນໆ).
 */
export default function InlineLoading() {
  return (
    <div className="flex align-items-center justify-content-center gap-2 py-6 text-500" aria-busy="true" aria-live="polite">
      <i className="pi pi-spin pi-spinner" style={{ fontSize: '1.25rem' }} aria-hidden />
      <span>ກຳລັງໂຫຼດຂໍ້ມູນ...</span>
    </div>
  );
}
