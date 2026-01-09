import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mail, User, Send, Loader2 } from 'lucide-react';

export default function TesterInvitationForm({ onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    tester_name: '',
    invited_email: '',
    custom_message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tester_name || !formData.invited_email) {
      toast.error('Name und E-Mail erforderlich');
      return;
    }

    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('sendTesterInvitation', formData);
      
      if (response.data.success) {
        toast.success(`Einladung versendet an ${formData.invited_email} ✅`);
        setFormData({ tester_name: '', invited_email: '', custom_message: '' });
        onSuccess?.();
      } else {
        toast.error(response.data.error || 'Fehler beim Versand');
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="flex gap-2 items-center mb-4">
        <User className="w-5 h-5 text-slate-400" />
        <h3 className="text-lg font-light text-slate-700">Neuer Tester einladen</h3>
      </div>

      <div>
        <label className="block text-sm font-light text-slate-600 mb-2">Name *</label>
        <Input
          type="text"
          name="tester_name"
          value={formData.tester_name}
          onChange={handleChange}
          placeholder="z.B. Max Mustermann"
          className="font-light"
        />
      </div>

      <div>
        <label className="block text-sm font-light text-slate-600 mb-2">
          <Mail className="w-4 h-4 inline mr-1" />
          E-Mail-Adresse *
        </label>
        <Input
          type="email"
          name="invited_email"
          value={formData.invited_email}
          onChange={handleChange}
          placeholder="max@example.com"
          className="font-light"
        />
      </div>

      <div>
        <label className="block text-sm font-light text-slate-600 mb-2">
          Persönliche Nachricht (optional)
        </label>
        <Textarea
          name="custom_message"
          value={formData.custom_message}
          onChange={handleChange}
          placeholder="Hinterlasse eine persönliche Nachricht für den Tester..."
          className="font-light h-32"
        />
        <p className="text-xs text-slate-400 mt-1">
          Falls leer, wird eine Standard-Nachricht verwendet
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => setFormData({ tester_name: '', invited_email: '', custom_message: '' })}
          disabled={isLoading}
        >
          Zurücksetzen
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-slate-700 hover:bg-slate-800 text-white gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Wird versendet...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Einladung versendet
            </>
          )}
        </Button>
      </div>
    </form>
  );
}