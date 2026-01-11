import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function BulkMessaging() {
  const [selectedBuildings, setSelectedBuildings] = useState([]);
  const [messageType, setMessageType] = useState('email');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(),
  });

  const queryClient = useQueryClient();

  const handleSend = async () => {
    if (!selectedBuildings.length || !subject || !content) {
      alert('Bitte füllen Sie alle Felder aus');
      return;
    }

    setSending(true);
    try {
      // Hier würde die API-Logik für Massen-Versand stattfinden
      console.log('Sending bulk message', {
        buildings: selectedBuildings,
        type: messageType,
        subject,
        content
      });
      alert('Nachricht wurde versendet!');
      setSubject('');
      setContent('');
      setSelectedBuildings([]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Massen-Versand</h1>
        <p className="text-slate-600 font-light mt-2">Senden Sie Nachrichten an mehrere Gebäude gleichzeitig</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Konfiguration */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nachrichtentyp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['email', 'sms', 'whatsapp'].map(type => (
                  <button
                    key={type}
                    onClick={() => setMessageType(type)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      messageType === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {type === 'email' && 'E-Mail'}
                    {type === 'sms' && 'SMS'}
                    {type === 'whatsapp' && 'WhatsApp'}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Betreff / Titel</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Nachricht-Betreff eingeben"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nachricht</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Geben Sie Ihre Nachricht ein..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-48"
              />
            </CardContent>
          </Card>

          <Button 
            onClick={handleSend}
            disabled={sending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Wird versendet...' : 'Nachricht versendet'}
          </Button>
        </div>

        {/* Gebäude-Auswahl */}
        <Card>
          <CardHeader>
            <CardTitle>Gebäude auswählen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {buildings.map(building => (
              <label key={building.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded">
                <input
                  type="checkbox"
                  checked={selectedBuildings.includes(building.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBuildings([...selectedBuildings, building.id]);
                    } else {
                      setSelectedBuildings(selectedBuildings.filter(id => id !== building.id));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">{building.name}</span>
              </label>
            ))}
            {buildings.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Keine Gebäude vorhanden</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}