'use client';

import React, { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelectCategories } from '../GroupProblem/hooks/useSelectCategories';
import { useSelectTickets } from './hooks/useSelectTickets';
import { TicketCard } from './TicketCard';
import InlineLoading from '@/app/components/InlineLoading';

export default function TicketListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryIdParam = searchParams.get('categoryId') ?? searchParams.get('issueId') ?? '';
  const categoryId = categoryIdParam ? Number(categoryIdParam) : null;

  const { items: categoryItems } = useSelectCategories(!!categoryIdParam);
  const { items: tickets, loading: ticketsLoading, error: ticketsError } = useSelectTickets(
    categoryId,
    !!categoryIdParam && categoryId != null && !Number.isNaN(categoryId)
  );

  const categoryLabel = useMemo(() => {
    if (categoryId == null) return '';
    return categoryItems.find((c) => c.id === categoryId)?.title ?? '';
  }, [categoryItems, categoryId]);

  const isLoading = ticketsLoading;

  const handleCardClick = (topicId: number, title: string) => {
    router.push(
      `/uikit/invalidstate?ticketId=${topicId}&title=${encodeURIComponent(title)}`
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-content-center align-items-center min-h-[50vh]">
        <InlineLoading />
      </div>
    );
  }

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

          {!categoryIdParam ? (
            <div className="text-center text-600 py-6">
              ກະລຸນາເລືອກຫມວດໝູ່ຈາກຫນ້າ ແຈ້ງບັນຫາ ຫຼື ບໍລິການ
            </div>
          ) : ticketsError ? (
            <div className="text-center text-600 py-6">
              <i className="pi pi-exclamation-triangle mb-2" />
              <p className="m-0">{ticketsError}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center text-600 py-6">
              ບໍ່ພົບລາຍການຫົວຂໍ້ຍ່ອຍໃນຫມວດໝູ່ນີ້
            </div>
          ) : (
            <div className="grid">
              {tickets.map((item) => (
                <TicketCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  onClick={() => handleCardClick(item.id, item.title)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
