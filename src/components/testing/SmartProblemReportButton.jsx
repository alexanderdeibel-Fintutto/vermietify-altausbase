import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import IntelligentProblemDialog from './IntelligentProblemDialog';

export default function SmartProblemReportButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const location = useLocation();

  // Business-Kritikalität basierend auf aktueller Seite
  const getPageCriticality = () => {
    const path = location.pathname.toLowerCase();
    
    // KRITISCH - Rot
    if (path.includes('login') || path.includes('auth') || 
        path.includes('finanzen') || path.includes('bank') ||
        path.includes('objects') || path.includes('buildings') ||
        path.includes('tenants') || path.includes('contracts')) {
      return { level: 'critical', color: 'bg-red-600 hover:bg-red-700', area: getCriticalArea(path) };
    }
    
    // WICHTIG - Orange
    if (path.includes('documents') || path.includes('tax') ||
        path.includes('operating') || path.includes('invoices')) {
      return { level: 'important', color: 'bg-orange-600 hover:bg-orange-700', area: getImportantArea(path) };
    }
    
    // STANDARD - Blau
    return { level: 'standard', color: 'bg-blue-600 hover:bg-blue-700', area: 'dashboard' };
  };

  const getCriticalArea = (path) => {
    if (path.includes('login') || path.includes('auth')) return 'auth_login';
    if (path.includes('finanzen') || path.includes('bank')) return 'finances';
    if (path.includes('objects') || path.includes('buildings')) return 'objects';
    if (path.includes('tenants') || path.includes('contracts')) return 'tenants';
    return 'objects';
  };

  const getImportantArea = (path) => {
    if (path.includes('documents')) return 'documents';
    if (path.includes('tax')) return 'taxes';
    if (path.includes('operating')) return 'operating_costs';
    return 'documents';
  };

  const criticality = getPageCriticality();

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        className={`${criticality.color} fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50 transition-transform hover:scale-110`}
        title="Problem melden"
      >
        <AlertCircle className="w-6 h-6" />
      </Button>

      <IntelligentProblemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultBusinessArea={criticality.area}
        pageContext={{
          url: window.location.href,
          title: document.title,
          criticality: criticality.level
        }}
      />
    </>
  );
}