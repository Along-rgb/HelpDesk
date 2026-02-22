'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { getTicketsByCategory } from './ticketData';
import { TicketCard } from './TicketCard';

const CATEGORY_LABELS: Record<string, string> = {
  PHONE: 'ການສື່ສານ (Communication)',
  NET: 'ອິນເຕີເນັດ-ເນັດເວີກ (Internet-Network)',
  IT: 'ຄອມພີວເຕີທົ່ວໄປ (Computer)',
  SerCOM: 'ບໍລິການຄອມພີວເຕີທົ່ວໄປ',
  SerSOFT: 'ບໍລິການດ້ານ Software',
  SerOTHER: 'ບໍລິການອື່ນໆ',
};

export default function TicketListPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || '';

  const tickets = category ? getTicketsByCategory(category) : [];
  const categoryLabel = category ? CATEGORY_LABELS[category] || category : '';

  return (
    <div className="flex justify-content-center px-2">
      <div className="w-full md:w-10 lg:w-8">
        <div className="card mb-0 bg-blue-50">
          <div className="flex flex-column align-items-center justify-content-center mb-4 text-center">
            <h3 className="m-0">ຫົວຂໍ້ຍ່ອຍ (Tickets)</h3>
            {categoryLabel && (
              <h5 className="m-0 mt-2 text-700">
                ຫມວດໝູ່: {categoryLabel}
              </h5>
            )}
          </div>

          {!category ? (
            <div className="text-center text-600 py-6">
              ກະລຸນາເລືອກຫມວດໝູ່ຈາກຫນ້າ ແຈ້ງບັນຫາ ຫຼື ບໍລິການ
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center text-600 py-6">
              ບໍ່ພົບລາຍການຫົວຂໍ້ຍ່ອຍໃນຫມວດໝູ່ນີ້
            </div>
          ) : (
            <div className="grid">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  categoryId={category}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
