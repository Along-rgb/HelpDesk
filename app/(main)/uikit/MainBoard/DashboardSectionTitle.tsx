'use client';

import React from 'react';

export interface DashboardSectionTitleProps {
  /** Section title text */
  title: string;
  /** Optional PrimeIcons class (e.g. "pi pi-th-large") */
  icon?: string;
}

/**
 * Reusable section title for dashboard pages.
 * Keeps layout consistent and makes it easy to change styling in one place.
 */
export function DashboardSectionTitle({ title, icon }: DashboardSectionTitleProps) {
  return (
    <div className="col-12">
      <h4 className="text-900 font-bold flex align-items-center gap-2">
        {icon && <i className={icon} />}
        {title}
      </h4>
    </div>
  );
}
