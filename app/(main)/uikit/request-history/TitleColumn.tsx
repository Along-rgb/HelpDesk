'use client';

import React from 'react';
import Link from 'next/link';
import { encryptId } from '@/lib/crypto';

interface TitleColumnProps {
    title: string;
    id: string;
}

export function TitleColumn({ title, id }: TitleColumnProps) {
    return (
        <Link
            href={`/uikit/ticket-detail/${encryptId(id)}`}
            className="no-underline text-900 font-medium hover:text-blue-600"
            style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
            {title || '—'}
        </Link>
    );
}
