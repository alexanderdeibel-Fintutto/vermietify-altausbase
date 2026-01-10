import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Mail, Phone, Calendar, Briefcase, User } from 'lucide-react';
import TenantEditDialog from './TenantEditDialog';

export default function TenantProfileCard({ tenant, onUpdate }) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Profil-Informationen</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Bearbeiten
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div className="flex items-start gap-4 pb-4 border-b">
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {tenant.first_name?.charAt(0)}{tenant.last_name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {tenant.first_name} {tenant.last_name}
                  </h2>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Aktiv
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Kontaktdaten */}
            <div className="col-span-2 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Kontaktdaten</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">E-Mail:</span>
                  <span className="font-medium">{tenant.email || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Telefon:</span>
                  <span className="font-medium">{tenant.phone || '-'}</span>
                </div>
              </div>
            </div>

            {/* Persönliche Daten */}
            <div className="col-span-2 pt-4 border-t">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Persönliche Daten</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Geburtsdatum:</span>
                  <span className="font-medium">
                    {tenant.date_of_birth 
                      ? new Date(tenant.date_of_birth).toLocaleDateString('de-DE') 
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Beruf:</span>
                  <span className="font-medium">{tenant.occupation || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Arbeitgeber:</span>
                  <span className="font-medium">{tenant.employer || '-'}</span>
                </div>
              </div>
            </div>

            {/* Zusatzinformationen */}
            {tenant.notes && (
              <div className="col-span-2 pt-4 border-t">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Notizen</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{tenant.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TenantEditDialog
        tenant={tenant}
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSuccess={onUpdate}
      />
    </>
  );
}