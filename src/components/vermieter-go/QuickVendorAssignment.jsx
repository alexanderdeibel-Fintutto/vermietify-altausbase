import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wrench, Phone, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickVendorAssignment({ taskId, category }) {
  const queryClient = useQueryClient();

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', category],
    queryFn: () => base44.entities.Vendor.filter(
      { 
        is_active: true,
        specialties: { $in: [category] }
      },
      '-rating',
      10
    )
  });

  const assignMutation = useMutation({
    mutationFn: async (vendorId) => {
      const vendor = vendors.find(v => v.id === vendorId);
      
      return await base44.entities.VendorTask.create({
        vendor_id: vendorId,
        building_task_id: taskId,
        title: 'Auftrag aus Vermieter Go',
        category: category,
        status: 'assigned',
        assigned_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorTasks'] });
      toast.success('Handwerker zugewiesen');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Handwerker-Zuweisung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {vendors.map(vendor => (
          <div key={vendor.id} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-semibold text-sm">{vendor.company_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs">{vendor.rating?.toFixed(1)}</span>
                  </div>
                  {vendor.preferred && (
                    <Badge className="bg-purple-100 text-purple-800 text-xs">⭐ Favorit</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${vendor.phone}`} className="flex-1">
                <Button size="sm" variant="outline" className="w-full">
                  <Phone className="w-3 h-3 mr-1" />
                  Anrufen
                </Button>
              </a>
              <Button
                size="sm"
                onClick={() => assignMutation.mutate(vendor.id)}
                className="flex-1"
              >
                Zuweisen
              </Button>
            </div>
          </div>
        ))}
        {vendors.length === 0 && (
          <p className="text-center text-slate-600 py-4">Keine Handwerker gefunden</p>
        )}
      </CardContent>
    </Card>
  );
}