'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Image } from 'primereact/image';
import { Paginator, type PaginatorPageChangeEvent } from 'primereact/paginator';
import { env } from '@/config/env';
import type { Assignee } from './types';

const COMMENT_IMG_PATH_SEGMENT = 'commentimg';

function getCommentImgUrl(filename: string | null | undefined): string {
  if (!filename || typeof filename !== 'string') return '';
  const name = filename.trim();
  if (!name) return '';
  if (name.startsWith('http://') || name.startsWith('https://')) return name;
  const cleanName = name.replace(/^\//, '');
  const base = (env.helpdeskUploadRequestBaseUrl ?? '').trim();
  if (base) return `${base}/${COMMENT_IMG_PATH_SEGMENT}/${encodeURIComponent(cleanName)}`;
  if (env.useHelpdeskProxy) return `/api/proxy-helpdesk/upload/${COMMENT_IMG_PATH_SEGMENT}/${encodeURIComponent(cleanName)}`;
  return '';
}

export interface SolutionViewDialogProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
  ticketId?: number | string | null;
  ticketTitle?: string | null;
  targetStatusName: string;
  assignees: Assignee[];
}

export function SolutionViewDialog({
  visible,
  onHide,
  onConfirm,
  ticketId,
  ticketTitle,
  targetStatusName,
  assignees,
}: SolutionViewDialogProps) {
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (visible) setPageIndex(0);
  }, [visible]);

  const current = useMemo(() => assignees[pageIndex] ?? null, [assignees, pageIndex]);
  const imgUrl = useMemo(() => getCommentImgUrl(current?.commentImg), [current]);

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="ຍົກເລີກ"
        className="p-button-outlined"
        onClick={onHide}
      />
      <Button
        label="ບັນທຶກ"
        icon="pi pi-check"
        onClick={onConfirm}
      />
    </div>
  );

  return (
    <Dialog
      header={
        <div className="flex align-items-center gap-2" style={{ maxWidth: '75vw' }}>
          <span className="font-semibold">ລາຍງານ</span>
          {ticketId != null && String(ticketId).trim() !== '' && (
            <span className="text-600 font-semibold">#{ticketId}</span>
          )}
          {ticketTitle != null && ticketTitle.trim() !== '' && (
            <span
              className="text-700 font-semibold"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={ticketTitle}
            >
              {ticketTitle}
            </span>
          )}
        </div>
      }
      visible={visible}
      style={{ width: 'min(700px, 95vw)' }}
      modal
      onHide={onHide}
      footer={footer}
      dismissableMask
    >
      {current ? (
        <div className="flex flex-column gap-3">
          <div className="flex align-items-center justify-content-between">
            <span className="font-semibold" style={{ color: 'var(--primary-color)' }}>
              {targetStatusName}
            </span>
            {assignees.length > 1 && (
              <span className="text-500 text-sm">{pageIndex + 1} / {assignees.length} ຄົນ</span>
            )}
          </div>

          <div className="flex flex-column gap-1">
            <label className="font-semibold text-700">ລາຍງານໂດຍ</label>
            <div className="p-3 surface-100 border-round">
              <span className="font-medium">{current.name}</span>
              {current.emp_code && (
                <span className="text-500 ml-2">({current.emp_code})</span>
              )}
            </div>
          </div>

          <div className="flex flex-column gap-1">
            <label className="font-semibold text-700">ລາຍລະອຽດການແກ້ໄຂ</label>
            <div
              className="p-3 surface-100 border-round"
              style={{ minHeight: '4rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {current.comment && current.comment.trim() !== '' ? (
                <span>{current.comment}</span>
              ) : (
                <span className="text-400">— ບໍ່ມີລາຍລະອຽດ —</span>
              )}
            </div>
          </div>

          <div className="flex flex-column gap-1">
            <label className="font-semibold text-700">ຮູບພາບ</label>
            {imgUrl ? (
              <div
                className="flex justify-content-center border-1 surface-border border-round p-2"
                style={{ background: '#000', borderRadius: '0.5rem', overflow: 'hidden' }}
              >
                <Image
                  src={imgUrl}
                  alt="ຮູບພາບລາຍງານ"
                  width="100%"
                  preview
                  imageStyle={{ maxHeight: '360px', objectFit: 'contain', width: '100%' }}
                />
              </div>
            ) : (
              <div className="p-3 surface-100 border-round text-center text-400">
                — ບໍ່ມີຮູບພາບ —
              </div>
            )}
          </div>

          {assignees.length > 1 && (
            <Paginator
              first={pageIndex}
              rows={1}
              totalRecords={assignees.length}
              onPageChange={(e: PaginatorPageChangeEvent) => setPageIndex(e.first)}
              template="PrevPageLink CurrentPageReport NextPageLink"
              currentPageReportTemplate="{currentPage} / {totalPages}"
            />
          )}
        </div>
      ) : (
        <div className="text-center p-4 text-400">ບໍ່ພົບຂໍ້ມູນ</div>
      )}
    </Dialog>
  );
}
