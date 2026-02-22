'use client';

import React from 'react';
import { Avatar } from 'primereact/avatar';

/** Minimal props for the profile header (avatar + name + role). */
export interface UserProfileHeaderProps {
  /** Display name (e.g. full name) */
  fullName: string;
  /** Role or position to show under the name */
  role?: string;
  /** Avatar image URL; if not set, no avatar is shown */
  avatarUrl?: string;
}

const DEFAULT_AVATAR = '/layout/images/avatar-default.png';

/**
 * Reusable header showing user avatar, name, and role.
 * Pass only display data as props so the parent can refactor data source without touching this UI.
 */
export function UserProfileHeader({ fullName, role, avatarUrl }: UserProfileHeaderProps) {
  const src = avatarUrl || DEFAULT_AVATAR;
  return (
    <div className="profile-header">
      <div className="flex align-items-center gap-4">
        <Avatar
          image={src}
          size="xlarge"
          shape="circle"
          className="profile-avatar shadow-2"
          
        />
        <div>
          <h2 className="m-0">{fullName || 'User'}</h2>
          {role != null && role !== '' && <p className="text-500 mt-1">{role}</p>}
        </div>
      </div>
    </div>
  );
}
