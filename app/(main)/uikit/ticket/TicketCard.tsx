'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ticket } from './types';

const TICKET_IMG_SIZE = 72; // px เท่ากันทุกการ์ด

interface TicketCardProps {
  ticket: Ticket;
  categoryId: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, categoryId }) => {
  const [isHovered, setIsHovered] = useState(false);

  const href = `/uikit/invalidstate?category=${encodeURIComponent(categoryId)}&ticketId=${encodeURIComponent(ticket.id)}`;

  return (
    <div className="col-12 md:col-6 lg:col-4 p-2">
      <Link href={href} className="no-underline" style={{ display: 'block', height: '100%' }}>
        <div
          className="bg-white border-1 border-200 border-round-lg p-4 text-center cursor-pointer transition-all transition-duration-300 flex flex-column align-items-center"
          style={{
            minHeight: '280px',
            height: '100%',
            boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
            transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* รูปจาก layout/images แทน icon ขนาดคงที่ */}
          <div
            className="flex align-items-center justify-content-center flex-1 py-3"
            style={{ minHeight: '100px' }}
          >
            <img
              src="/layout/images/tickets.png"
              alt=""
              width={TICKET_IMG_SIZE}
              height={TICKET_IMG_SIZE}
              style={{ objectFit: 'contain', flexShrink: 0 }}
            />
          </div>
          {/* เส้นขีดกั้นเต็มความกว้างของการ์ด */}
          <div
            className="border-top-1 border-200"
            style={{ width: '100%', margin: 0, flexShrink: 0 }}
            aria-hidden
          />
          {/* พื้นที่ title + description สูงคงที่เท่ากันทุกการ์ด (ระยะห่างใกล้เส้น/ใกล้กันแต่ไม่ติด) */}
          <div
            className="flex flex-column align-items-center w-full pt-2 flex-1"
            style={{ minHeight: '7.5rem' }}
          >
            <h4
              className="text-900 font-bold m-0 line-height-3 text-center w-full"
              style={{
                fontSize: '1.2rem',
                minHeight: '4.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.375rem',
              }}
            >
              {ticket.title}
            </h4>
            <p
              className="text-600 m-0 line-height-3 text-center w-full"
              style={{
                fontSize: '1rem',
                minHeight: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {ticket.description}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
