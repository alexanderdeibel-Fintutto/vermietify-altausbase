import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Building2, Wrench, Edit, Trash2 } from 'lucide-react';

const specializationLabels = {
  electrical: 'Elektrik',
  plumbing: 'Sanitär',
  heating: 'Heizung',
  cleaning: 'Reinigung',
  general: 'Allgemein'
};

const roleLabels = {
  building_manager: 'Gebäudemanager',
  caretaker: 'Hausmeister',
  technician: 'Techniker'
};

export default function TechnicianCard({ technician, onEdit, onDelete }) {
  return (
    <Card className={!technician.is_active ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">{technician.full_name}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {roleLabels[technician.role]}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => onEdit(technician)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onDelete(technician.id)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {technician.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-slate-600" />
            <span>{technician.phone}</span>
          </div>
        )}

        {technician.specializations?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Fachgebiete</p>
            <div className="flex flex-wrap gap-1">
              {technician.specializations.map(spec => (
                <Badge key={spec} className="bg-blue-100 text-blue-800 text-xs">
                  {specializationLabels[spec] || spec}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {technician.assigned_buildings?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>{technician.assigned_buildings.length} Gebäude zugewiesen</span>
            </div>
          </div>
        )}

        {technician.availability_hours && (
          <div className="text-xs text-slate-600">
            Verfügbar: {technician.availability_hours}
          </div>
        )}

        {!technician.is_active && (
          <Badge className="bg-slate-500">Inaktiv</Badge>
        )}
      </CardContent>
    </Card>
  );
}