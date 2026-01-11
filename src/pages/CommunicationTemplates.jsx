import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2, Copy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CommunicationTemplates() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', subject: '', content: '' });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.role === 'admin';

  const defaultTemplates = [
    { id: 1, name: 'Mieterwillkommen', subject: 'Willkommen im Mieterportal', content: 'Liebe/r Mieter/in...' },
    { id: 2, name: 'Zahlungserinnerung', subject: 'Zahlungserinnerung', content: 'Ihre Miete ist fällig...' },
    { id: 3, name: 'Wartungsankündigung', subject: 'Geplante Wartungsarbeiten', content: 'Wir informieren Sie hiermit...' },
    { id: 4, name: 'Vertragsverlängerung', subject: 'Vertragsverlängerung', content: 'Ihr Mietvertrag läuft bald aus...' },
  ];

  const handleSave = () => {
    console.log('Saving template:', formData);
    setFormData({ name: '', subject: '', content: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (template) => {
    setFormData(template);
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleDuplicate = (template) => {
    setFormData({ ...template, name: `${template.name} (Kopie)` });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Nachrichtenvorlagen</h1>
          <p className="text-slate-600 font-light mt-2">Verwalten Sie Nachrichtenvorlagen für schnelle Kommunikation</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Neue Vorlage
          </Button>
        )}
      </div>

      {/* Formular */}
      {showForm && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Vorlagenname</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Zahlungserinnerung"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Betreff</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Nachricht-Betreff"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Inhalt</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Nachrichtinhalt..."
                className="min-h-40"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                Speichern
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: '', subject: '', content: '' });
                  setEditingId(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vorlagenliste */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {defaultTemplates.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <p className="text-sm text-slate-600 mt-2">{template.subject}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 line-clamp-3 mb-4">{template.content}</p>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(template)}>
                    <Edit2 className="w-3 h-3 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDuplicate(template)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}