import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({ 
  title, 
  subtitle, 
  actions, 
  backButton = true 
}) {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {backButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="gap-1 mb-4 pl-0"
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </Button>
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}