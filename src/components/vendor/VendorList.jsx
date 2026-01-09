import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Phone, Mail, Edit, FileText, Award } from 'lucide-react';
import VendorDetailDialog from '@/components/vendor/VendorDetailDialog';

export default function VendorList({ vendors, searchQuery, onEdit }) {
  const [selectedVendor, setSelectedVendor] = useState(null);

  const filteredVendors = vendors.filter(v =>
    v.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const specialtyLabels = {
    plumbing: '🔧 Sanitär',
    electrical: '⚡ Elektrik',
    heating: '🔥 Heizung',
    cleaning: '🧹 Reinigung',
    painting: '🎨 Maler',
    carpentry: '🪚 Tischlerei',
    locksmith: '🔑 Schlüsseldienst',
    roofing: '🏠 Dach',
    gardening: '🌿 Garten',
    general: '🔨 Allgemein'
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVendors.map(vendor => (
          <Card key={vendor.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{vendor.company_name}</h3>
                    {vendor.preferred && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Award className="w-3 h-3 mr-1" />
                        Bevorzugt
                      </Badge>
                    )}
                    {!vendor.is_active && (
                      <Badge variant="outline">Inaktiv</Badge>
                    )}
                  </div>
                  {vendor.contact_person && (
                    <p className="text-sm text-slate-600">{vendor.contact_person}</p>
                  )}
                </div>
                {vendor.rating > 0 && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">{vendor.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-3 h-3" />
                  {vendor.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-3 h-3" />
                  {vendor.phone}
                </div>
              </div>

              {vendor.specialties && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {vendor.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {specialtyLabels[specialty]}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3 pb-3 border-b">
                <div>Aufträge: <span className="font-semibold">{vendor.total_jobs || 0}</span></div>
                <div>Ausgaben: <span className="font-semibold">{(vendor.total_spent || 0).toLocaleString('de-DE')}€</span></div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedVendor(vendor)} className="flex-1">
                  <FileText className="w-3 h-3 mr-1" />
                  Details
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(vendor)}>
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedVendor && (
        <VendorDetailDialog
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </div>
  );
}