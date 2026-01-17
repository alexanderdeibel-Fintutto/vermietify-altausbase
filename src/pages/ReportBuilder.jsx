import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import CustomReportBuilder from '@/components/reporting/CustomReportBuilder';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function ReportBuilder() {
  const [generatedReport, setGeneratedReport] = useState(null);

  const handleGenerate = (config) => {
    console.log('Generating report with config:', config);
    showSuccess('Bericht wird erstellt...');
    
    setTimeout(() => {
      setGeneratedReport({
        type: config.reportType,
        generated_at: new Date(),
        data: {}
      });
      showSuccess('Bericht erfolgreich erstellt');
    }, 1500);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Bericht-Generator"
        subtitle="Erstellen Sie individuelle Berichte"
      />

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        <div>
          <CustomReportBuilder onGenerate={handleGenerate} />
        </div>

        <div className="vf-card p-6">
          {generatedReport ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--vf-success-100)] flex items-center justify-center">
                <Download className="h-10 w-10 text-[var(--vf-success-600)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bericht bereit</h3>
              <p className="text-[var(--theme-text-secondary)] mb-6">
                Ihr {generatedReport.type}-Bericht wurde erfolgreich erstellt
              </p>
              <Button variant="gradient" size="lg">
                <Download className="h-5 w-5 mr-2" />
                Herunterladen
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--theme-text-muted)]">
              <p>Konfigurieren Sie Ihren Bericht links und klicken Sie auf "Generieren"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}