import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardCheck, Upload, Plus } from 'lucide-react';

export default function HandoverProtocolBuilder({ unitId, companyId }) {
  const [rooms, setRooms] = useState([
    { name: 'Wohnzimmer', condition: 'good', notes: '', photos: [] }
  ]);
  const queryClient = useQueryClient();

  const addRoom = () => {
    setRooms([...rooms, { name: '', condition: 'good', notes: '', photos: [] }]);
  };

  const updateRoom = (index, field, value) => {
    const updated = [...rooms];
    updated[index][field] = value;
    setRooms(updated);
  };

  const uploadPhoto = async (index, file) => {
    const { data } = await base44.integrations.Core.UploadFile({ file });
    const updated = [...rooms];
    updated[index].photos = [...updated[index].photos, data.file_url];
    setRooms(updated);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      base44.asServiceRole.entities.HandoverProtocol.create({
        unit_id: unitId,
        company_id: companyId,
        protocol_type: 'move_out',
        protocol_date: new Date().toISOString().split('T')[0],
        rooms
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handover-protocols'] });
      setRooms([{ name: 'Wohnzimmer', condition: 'good', notes: '', photos: [] }]);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4" />
          Übergabeprotokoll
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rooms.map((room, i) => (
          <div key={i} className="p-3 border rounded space-y-2">
            <Input
              placeholder="Raum (z.B. Wohnzimmer)"
              value={room.name}
              onChange={(e) => updateRoom(i, 'name', e.target.value)}
              className="text-sm"
            />
            <select
              value={room.condition}
              onChange={(e) => updateRoom(i, 'condition', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="excellent">Ausgezeichnet</option>
              <option value="good">Gut</option>
              <option value="fair">Befriedigend</option>
              <option value="poor">Mangelhaft</option>
            </select>
            <Textarea
              placeholder="Notizen"
              value={room.notes}
              onChange={(e) => updateRoom(i, 'notes', e.target.value)}
              className="text-sm h-16"
            />
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed rounded p-2 text-center hover:bg-slate-50">
                  <Upload className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">Foto hochladen</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => uploadPhoto(i, e.target.files[0])}
                />
              </label>
            </div>
            {room.photos.length > 0 && (
              <p className="text-xs text-slate-600">{room.photos.length} Foto(s)</p>
            )}
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addRoom}
          className="w-full gap-2"
        >
          <Plus className="w-3 h-3" />
          Raum hinzufügen
        </Button>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full"
        >
          Protokoll speichern
        </Button>
      </CardContent>
    </Card>
  );
}