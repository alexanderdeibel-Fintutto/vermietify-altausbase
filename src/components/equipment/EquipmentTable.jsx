import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function EquipmentTable({ equipment = [], buildings = {}, onEdit, onDelete, loading }) {
  const [selectedId, setSelectedId] = useState(null);

  const equipmentTypeLabels = {
    heating_system: '🔥 Heizung',
    cooling_system: '❄️ Kühlung',
    elevator: '🛗 Aufzug',
    pump: '💧 Pumpe',
    boiler: '🫖 Kessel',
    generator: '⚡ Generator',
    water_heater: '🌡️ Warmwasser',
    ventilation: '💨 Lüftung',
    other: '📦 Sonstiges'
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
    maintenance: 'bg-yellow-100 text-yellow-700',
    defective: 'bg-red-100 text-red-700'
  };

  const isMaintenanceOverdue = (nextDate) => {
    if (!nextDate) return false;
    return new Date(nextDate) < new Date();
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500 font-light">Lädt...</div>;
  }

  if (equipment.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600 font-light">Keine Geräte vorhanden. Erstellen Sie ein neues Gerät.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {equipment.map(item => (
        <Card
          key={item.id}
          className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
            selectedId === item.id ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="font-light text-slate-900">{item.name}</h4>
                <Badge className={statusColors[item.status]}>
                  {item.status === 'active' ? '✅' : item.status === 'maintenance' ? '🔧' : item.status === 'defective' ? '❌' : '⭕'}
                </Badge>
                {isMaintenanceOverdue(item.next_maintenance_date) && item.status !== 'defective' && (
                  <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Wartung fällig
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3 text-sm">
                <div>
                  <p className="text-slate-500 font-light">Typ</p>
                  <p className="font-light text-slate-900">{equipmentTypeLabels[item.equipment_type]}</p>
                </div>

                <div>
                  <p className="text-slate-500 font-light">Gebäude</p>
                  <p className="font-light text-slate-900">{buildings[item.building_id]?.name || 'Unbekannt'}</p>
                </div>

                <div>
                  <p className="text-slate-500 font-light">Standort</p>
                  <p className="font-light text-slate-900">{item.location || '—'}</p>
                </div>

                <div>
                  <p className="text-slate-500 font-light">Seriennummer</p>
                  <p className="font-light text-slate-900">{item.serial_number || '—'}</p>
                </div>

                {item.last_maintenance_date && (
                  <div>
                    <p className="text-slate-500 font-light">Letzte Wartung</p>
                    <p className="font-light text-slate-900">
                      {format(new Date(item.last_maintenance_date), 'd. MMM yyyy', { locale: de })}
                    </p>
                  </div>
                )}

                {item.next_maintenance_date && (
                  <div>
                    <p className="text-slate-500 font-light">Nächste Wartung</p>
                    <p className={`font-light ${isMaintenanceOverdue(item.next_maintenance_date) ? 'text-red-600 font-medium' : 'text-slate-900'}`}>
                      {format(new Date(item.next_maintenance_date), 'd. MMM yyyy', { locale: de })}
                    </p>
                  </div>
                )}

                {item.manufacturer && (
                  <div>
                    <p className="text-slate-500 font-light">Hersteller</p>
                    <p className="font-light text-slate-900">{item.manufacturer}</p>
                  </div>
                )}
              </div>

              {item.notes && (
                <div className="mt-3 p-2 bg-slate-50 rounded text-xs font-light text-slate-600">
                  {item.notes}
                </div>
              )}
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                size="icon"
                variant="ghost"
                className="text-slate-400 hover:text-blue-600"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                size="icon"
                variant="ghost"
                className="text-slate-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}