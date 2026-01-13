import React from 'react';
import { Button } from '@/components/ui/button';

export default function PageHeader({ 
  title,
  description,
  actionLabel,
  onAction,
  children,
  loading = false
}) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="text-sm text-slate-600 mt-2">{description}</p>
          )}
        </div>
        {actionLabel && (
          <Button
            onClick={onAction}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
          >
            {loading ? 'Wird verarbeitet...' : actionLabel}
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}