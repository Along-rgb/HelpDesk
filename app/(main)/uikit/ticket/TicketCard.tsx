'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ticket } from './types';

const TICKET_IMG_REM = 4.5; // rem — ขยาย/หดตาม zoom

interface TicketCardProps {
  ticket: Ticket;
  categoryId: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, categoryId }) => {
  const [isHovered, setIsHovered] = useState(false);

  const href = `/uikit/invalidstate?category=${encodeURIComponent(categoryId)}&ticketId=${encodeURIComponent(ticket.id)}`;

  return (
    <div className="col-12 md:col-6 lg:col-4 p-2">
      <Link href={href} className="no-underline block h-full">
        <div
          className="bg-white border-1 border-200 border-round-lg p-4 text-center cursor-pointer transition-all transition-duration-300 flex flex-column align-items-center h-full"
          style={{
            minHeight: '17.5rem',
            boxShadow: isHovered ? '0 0.5rem 1.5rem rgba(0,0,0,0.12)' : '0 0.125rem 0.5rem rgba(0,0,0,0.06)',
            transform: isHovered ? 'translateY(-0.25rem)' : 'translateY(0)',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* รูปจาก layout/images — ขนาด rem รองรับ Zoom */}
          <div
            className="flex align-items-center justify-content-center flex-1 py-3"
            style={{ minHeight: '6.25rem' }}
          >
            <img
              src="/layout/images/tickets.png"
              alt=""
              className="flex-shrink-0"
              style={{
                width: `${TICKET_IMG_REM}rem`,
                height: `${TICKET_IMG_REM}rem`,
                objectFit: 'contain',
              }}
            />
          </div>
          <div className="border-top-1 border-200 w-full m-0 flex-shrink-0" aria-hidden />
          <div
            className="flex flex-column align-items-center w-full pt-2 flex-1"
            style={{ minHeight: '7.5rem' }}
          >
            <h4
              className="text-900 font-bold m-0 mb-2 line-height-3 text-center w-full flex align-items-center justify-content-center"
              style={{ fontSize: '1.2rem', minHeight: '4.5rem' }}
            >
              {ticket.title}
            </h4>
            <p
              className="text-600 m-0 line-height-3 text-center w-full flex align-items-center justify-content-center"
              style={{ fontSize: '1rem', lineHeight: '1.5rem', minHeight: '3rem' }}
            >
              {ticket.description}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
