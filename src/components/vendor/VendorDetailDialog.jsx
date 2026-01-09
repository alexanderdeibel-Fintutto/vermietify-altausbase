import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import VendorDocuments from '@/components/vendor/VendorDocuments';
import VendorRatings from '@/components/vendor/VendorRatings';

export default function VendorDetailDialog({ vendor, onClose }) {
  const { data: tasks = [] } = useQuery({
    queryKey: ['vendorTasks', vendor.id],
    queryFn: () => base44.entities.VendorTask.filter({ vendor_id: vendor.id }, '-created_date', 100),
    enabled: !!vendor.id
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>{vendor.company_name}</CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Informationen</TabsTrigger>
              <TabsTrigger value="tasks">Aufträge ({tasks.length})</TabsTrigger>
              <TabsTrigger value="documents">Dokumente</TabsTrigger>
              <TabsTrigger value="ratings">Bewertungen</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Ansprechpartner</p>
                  <p className="font-semibold">{vendor.contact_person || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">E-Mail</p>
                  <p className="font-semibold">{vendor.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Telefon</p>
                  <p className="font-semibold">{vendor.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Mobil</p>
                  <p className="font-semibold">{vendor.mobile || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Stundensatz</p>
                  <p className="font-semibold">{vendor.hourly_rate || 0}€/h</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Bewertung</p>
                  <p className="font-semibold">⭐ {vendor.rating || 0}/5</p>
                </div>
              </div>
              {vendor.notes && (
                <div>
                  <p className="text-sm text-slate-600">Notizen</p>
                  <p className="text-sm mt-1">{vendor.notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="pt-4">
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="p-3 border rounded">
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-sm text-slate-600">{task.status} - {task.actual_cost || 0}€</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="pt-4">
              <VendorDocuments vendorId={vendor.id} />
            </TabsContent>

            <TabsContent value="ratings" className="pt-4">
              <VendorRatings vendorId={vendor.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}