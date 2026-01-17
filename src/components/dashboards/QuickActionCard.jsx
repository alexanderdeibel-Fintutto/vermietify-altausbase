import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickActionCard({ 
  icon: Icon, 
  title, 
  description,
  href,
  color = 'primary'
}) {
  const colorClasses = {
    primary: 'bg-[var(--vf-primary-100)] text-[var(--vf-primary-600)]',
    accent: 'bg-[var(--vf-accent-100)] text-[var(--vf-accent-600)]',
    success: 'bg-[var(--vf-success-100)] text-[var(--vf-success-600)]',
    warning: 'bg-[var(--vf-warning-100)] text-[var(--vf-warning-600)]'
  };

  const CardWrapper = href ? Link : 'div';
  const wrapperProps = href ? { to: createPageUrl(href) } : {};

  return (
    <CardWrapper {...wrapperProps}>
      <Card className="vf-card-clickable h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
              <Icon className="h-6 w-6" />
            </div>
            {href && <ArrowRight className="h-5 w-5 text-[var(--theme-text-muted)]" />}
          </div>
          <h3 className="font-semibold mb-2">{title}</h3>
          <p className="text-sm text-[var(--theme-text-secondary)]">{description}</p>
        </CardContent>
      </Card>
    </CardWrapper>
  );
}