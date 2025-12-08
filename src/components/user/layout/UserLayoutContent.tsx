'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface UserLayoutContentProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export default function UserLayoutContent({
  children,
  title,
  subtitle,
  breadcrumbs,
  actions,
}: UserLayoutContentProps) {
  return (
    <>
      {/* Header */}
      {title && (
        <div className="mb-8">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="text-sm text-zinc-400 mb-3 flex items-center gap-2">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-zinc-600">/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-blue-400 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-white font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-zinc-400 text-sm md:text-base">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div>
        {children}
      </div>
    </>
  );
}
