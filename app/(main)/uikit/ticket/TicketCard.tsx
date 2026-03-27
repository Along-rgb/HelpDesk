'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export interface TicketCardProps {
  /** ຊື່ລາຍການຫົວຂໍ້ (Item Title) */
  title: string;
  /** ຄຳອະທິບາຍ (Item Description) */
  description: string;
  onClick: () => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  title,
  description,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = descRef.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight + 1);
  }, [description]);

  return (
    <div className="col-12 sm:col-6 md:col-4 lg:col-2 p-2">
      <div
        role="button"
        tabIndex={0}
        className="bg-white border-1 border-200 border-round-lg p-4 text-center cursor-pointer transition-all transition-duration-300 flex flex-column align-items-center h-full"
        style={{
          minHeight: '12rem',
          boxShadow: isHovered ? '0 0.5rem 1.5rem rgba(0,0,0,0.12)' : '0 0.125rem 0.5rem rgba(0,0,0,0.06)',
          transform: isHovered ? 'translateY(-0.25rem)' : 'translateY(0)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {/* Static icon — public/layout/images/tickets.png */}
        <div
          className="flex align-items-center justify-content-center flex-1 py-3"
          style={{ minHeight: '4rem', width: '100%' }}
        >
          <div
            className="flex align-items-center justify-content-center"
            style={{ width: '3.5rem', height: '3.5rem' }}
          >
            <Image
              src="/layout/images/tickets.png"
              alt=""
              width={56}
              height={56}
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
          </div>
        </div>
        <div className="border-top-1 border-200 w-full m-0 flex-shrink-0" aria-hidden />
        <div
          className="flex flex-column align-items-center w-full pt-2 flex-1"
          style={{ minHeight: '5rem' }}
        >
          <h4
            className="text-900 font-bold m-0 mb-2 line-height-3 text-center w-full flex align-items-center justify-content-center"
            style={{ fontSize: '1.125rem', minHeight: '3rem' }}
          >
            {title}
          </h4>
          <div
            className="relative w-full"
            onMouseEnter={() => isClamped && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <p
              ref={descRef}
              className="text-600 m-0 text-center w-full"
              style={{
                fontSize: '0.95rem',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minHeight: '2rem',
              }}
            >
              {description}
            </p>
            {showTooltip && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '8px',
                  backgroundColor: '#fff',
                  color: '#111',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  whiteSpace: 'normal',
                  maxWidth: '220px',
                  textAlign: 'center',
                  border: '1px solid #e0e0e0',
                }}
              >
                {description}
                <span
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderWidth: '6px',
                    borderStyle: 'solid',
                    borderColor: '#e53935 transparent transparent transparent',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
