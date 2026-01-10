import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Eye, Trash2 } from 'lucide-react';

export default function BuildingFloorPlan({ buildingId, floorPlans = [], onUpdate }) {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleFloorPlanUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const uploadedPlans = [];
      
      for (const file of files) {
        const result = await base44.integrations.Core.UploadFile({ file });
        uploadedPlans.push({
          id: Math.random().toString(36),
          url: result.file_url,
          name: file.name.replace(/\.[^/.]+$/, ''),
          uploadedAt: new Date().toISOString()
        });
      }

      onUpdate([...floorPlans, ...uploadedPlans]);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grundrisse</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload */}
        <label className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-slate-400">
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFloorPlanUpload}
            className="hidden"
          />
          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Grundriss hochladen</p>
        </label>

        {/* Floor Plans List */}
        <div className="space-y-2">
          {floorPlans.map(plan => (
            <div key={plan.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex-1">
                <p className="font-medium text-sm text-slate-900">{plan.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(plan.uploadedAt).toLocaleDateString('de-DE')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPlan(plan)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => onUpdate(floorPlans.filter(p => p.id !== plan.id))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {floorPlans.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-4">Keine Grundrisse vorhanden</p>
        )}

        {/* Preview Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-slate-900">{selectedPlan.name}</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedPlan(null)}>
                  ✕
                </Button>
              </div>
              <div className="p-4">
                {selectedPlan.url.includes('.pdf') ? (
                  <iframe src={selectedPlan.url} className="w-full h-96" />
                ) : (
                  <img src={selectedPlan.url} alt={selectedPlan.name} className="w-full" />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}