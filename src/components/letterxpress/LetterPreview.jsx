import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';

export default function LetterPreview({ template, recipientData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Vorschau
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white border-2 border-slate-200 p-8 rounded-lg aspect-[8.5/11] flex flex-col">
          {/* Briefkopf */}
          <div className="mb-8 pb-4 border-b-2 border-slate-200">
            <p className="font-bold text-sm">IHRE HAUSVERWALTUNG</p>
            <p className="text-xs text-slate-600 mt-1">Beispielstraße 1 | 10000 Berlin</p>
          </div>

          {/* Empfänger */}
          <div className="mb-8 text-sm">
            <p className="font-medium">{recipientData?.name || 'Mieter Name'}</p>
            <p className="text-slate-600">{recipientData?.address || 'Straße Hausnummer'}</p>
            <p className="text-slate-600">{recipientData?.postal || '10000'} {recipientData?.city || 'Stadt'}</p>
          </div>

          {/* Datum */}
          <div className="mb-8 text-sm">
            <p className="text-slate-600">Berlin, {new Date().toLocaleDateString('de-DE')}</p>
          </div>

          {/* Betreff */}
          <div className="mb-6 font-bold text-sm">
            <p>{template?.subject || 'Betreffzeile'}</p>
          </div>

          {/* Inhalt */}
          <div className="flex-1 text-sm text-slate-700 leading-relaxed">
            <p className="mb-4">Liebe/r {recipientData?.name?.split(' ')[0] || 'Mieter'}in,</p>
            <p className="mb-4">
              {template?.content || 'Hier befindet sich der Briefinhalt...'}
            </p>
            <p className="mb-4">Mit freundlichen Grüßen,</p>
          </div>

          {/* Signatur */}
          <div className="mt-8 pt-8 border-t border-slate-300">
            <p className="font-medium text-sm">Ihre Hausverwaltung</p>
            <p className="text-xs text-slate-600 mt-2">Telefon: 030 / 123456</p>
            <p className="text-xs text-slate-600">E-Mail: info@hausverwaltung.de</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}