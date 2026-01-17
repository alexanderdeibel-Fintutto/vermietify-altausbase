import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({ 
  title, 
  subtitle,
  actions,
  backButton = false 
}) {
  const navigate = useNavigate();

  return (
    <div className="vf-page-header">
      {backButton && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
      )}
      
      <div>
        <h1 className="vf-page-title">{title}</h1>
        {subtitle && <p className="vf-page-subtitle">{subtitle}</p>}
      </div>
      
      {actions && <div className="vf-page-actions">{actions}</div>}
    </div>
  );
}