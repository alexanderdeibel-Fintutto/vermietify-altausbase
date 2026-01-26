import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Send, Edit } from 'lucide-react';
import StatementStatusBadge from '@/components/shared/StatementStatusBadge';
import { formatCurrency } from '../../utils/costHelpers';

export default function StatementOverviewCard({ 
  statement, 
  building, 
  onEdit, 
  onDownload, 
  onSend,
  expanded = false,
  onToggle
}) {
  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onToggle}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-10 h-10 text-blue-600" />
            <div>
              <h3 className="font-semibold text-lg">Abrechnung {statement.abrechnungsjahr}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {building?.name} • {building?.address}, {building?.city}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(statement.zeitraum_von).toLocaleDateString('de-DE')} - 
                {new Date(statement.zeitraum_bis).toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <StatementStatusBadge status={statement.status} />
            {statement.gesamtkosten && (
              <div className="mt-2 font-semibold text-lg">
                {formatCurrency(statement.gesamtkosten)}
              </div>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Gesamtkosten</p>
                <p className="text-lg font-semibold">{formatCurrency(statement.gesamtkosten)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Vorauszahlungen</p>
                <p className="text-lg font-semibold">{formatCurrency(statement.gesamtvorauszahlungen)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ergebnis</p>
                <p className={`text-lg font-semibold ${
                  statement.gesamtergebnis >= 0 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {statement.gesamtergebnis >= 0 ? '+' : ''}{formatCurrency(statement.gesamtergebnis)}
                </p>
              </div>
            </div>

            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {statement.status === 'Entwurf' && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              {statement.status !== 'Versendet' && (
                <Button variant="default" size="sm" onClick={onSend} className="bg-blue-900">
                  <Send className="w-4 h-4 mr-2" />
                  Versenden
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}