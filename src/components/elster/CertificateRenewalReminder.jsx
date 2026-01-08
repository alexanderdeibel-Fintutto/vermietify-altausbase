import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Upload } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function CertificateRenewalReminder({ certificates, onUploadClick }) {
  const now = new Date();

  const expiringCertificates = certificates
    .filter(cert => cert.is_active && cert.valid_until)
    .map(cert => ({
      ...cert,
      daysRemaining: differenceInDays(parseISO(cert.valid_until), now)
    }))
    .filter(cert => cert.daysRemaining <= 90)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  if (expiringCertificates.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Zertifikat-Erneuerung erforderlich
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {expiringCertificates.map(cert => (
          <Alert key={cert.id} className="bg-white border-orange-200">
            <Calendar className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{cert.certificate_name}</div>
                  <div className="text-sm text-slate-600 mt-1">
                    Typ: {cert.certificate_type} · Steuernummer: {cert.tax_number}
                  </div>
                  <div className="text-sm text-orange-700 mt-1">
                    Gültig bis: {new Date(cert.valid_until).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <Badge 
                  variant={cert.daysRemaining < 30 ? 'destructive' : 'outline'}
                  className={cert.daysRemaining < 30 ? '' : 'border-orange-600 text-orange-700'}
                >
                  {cert.daysRemaining < 0 ? 'Abgelaufen' : `${cert.daysRemaining} Tage`}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        ))}

        <Button onClick={onUploadClick} className="w-full bg-orange-600 hover:bg-orange-700">
          <Upload className="w-4 h-4 mr-2" />
          Neues Zertifikat hochladen
        </Button>

        <div className="text-xs text-orange-800 bg-orange-100 p-2 rounded">
          💡 ELSTER-Zertifikate sind nur für eine begrenzte Zeit gültig. Laden Sie rechtzeitig ein neues Zertifikat hoch.
        </div>
      </CardContent>
    </Card>
  );
}