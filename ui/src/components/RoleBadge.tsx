import React from 'react';

export function RoleBadge({
  role,
  tooltipText,
  children,
}: {
  role: 'mod' | 'admin' | 'sitemod' | 'creator';
  children: any;
  tooltipText: string;
}) {
  return (
    <div
      className={`badge badge-light mx-1 comment-badge ${role}-badge`}
      data-tippy-content={tooltipText}
    >
      {children}
    </div>
  );
}
