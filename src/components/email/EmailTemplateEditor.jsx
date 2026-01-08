import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Eye, Code, Send } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_VARIABLES = {
  tenant: ['{tenant_name}', '{tenant_email}', '{building_address}', '{unit_number}', '{rent_amount}'],
  owner: ['{owner_name}', '{owner_email}', '{building_address}', '{property_value}'],
  supplier: ['{supplier_name}', '{supplier_email}', '{contract_number}', '{service_description}'],
  internal: ['{user_name}', '{user_email}', '{department}', '{date}'],
  system: ['{app_name}', '{support_email}', '{date}', '{time}'],
  marketing: ['{recipient_name}', '{recipient_email}', '{company_name}', '{date}']
};

export default function EmailTemplateEditor({ open, onOpenChange, template }) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'internal',
    is_active: true,
    variables: []
  });
  const [previewData, setPreviewData] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        category: template.category,
        is_active: template.is_active,
        variables: template.variables || []
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        body: '',
        category: 'internal',
        is_active: true,
        variables: []
      });
    }
  }, [template, open]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (template) {
        return base44.entities.EmailTemplate.update(template.id, data);
      }
      return base44.entities.EmailTemplate.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template gespeichert');
      onOpenChange(false);
    }
  });

  const insertVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body + ' ' + variable,
      variables: [...new Set([...prev.variables, variable])]
    }));
  };

  const generatePreview = () => {
    let preview = formData.body;
    Object.entries(previewData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return preview;
  };

  const availableVars = AVAILABLE_VARIABLES[formData.category] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Template bearbeiten' : 'Neues Template erstellen'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Template-Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="z.B. Willkommens-E-Mail"
              />
            </div>
            <div>
              <Label>Kategorie</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant">Mieter</SelectItem>
                  <SelectItem value="owner">Eigentümer</SelectItem>
                  <SelectItem value="supplier">Dienstleister</SelectItem>
                  <SelectItem value="internal">Intern</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Betreff</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              placeholder="E-Mail Betreff"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Verfügbare Variablen</Label>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg">
              {availableVars.map(v => (
                <Badge
                  key={v}
                  variant="outline"
                  className="cursor-pointer hover:bg-slate-200"
                  onClick={() => insertVariable(v)}
                >
                  {v}
                </Badge>
              ))}
            </div>
          </div>

          <Tabs defaultValue="edit">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">
                <Code className="w-4 h-4 mr-2" />
                Bearbeiten
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Vorschau
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              <div>
                <Label>E-Mail Inhalt</Label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData({...formData, body: e.target.value})}
                  placeholder="E-Mail Inhalt mit Variablen..."
                  className="min-h-[300px] font-mono"
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="space-y-2">
                <Label>Test-Werte für Variablen</Label>
                {availableVars.map(v => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="text-sm font-mono w-40">{v}</span>
                    <Input
                      placeholder="Test-Wert"
                      value={previewData[v] || ''}
                      onChange={(e) => setPreviewData({...previewData, [v]: e.target.value})}
                    />
                  </div>
                ))}
              </div>
              <div className="p-4 border rounded-lg bg-white">
                <div className="font-bold mb-2">{formData.subject}</div>
                <div className="whitespace-pre-wrap">{generatePreview()}</div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label>Template aktiv</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending || !formData.name || !formData.subject}
              >
                Speichern
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}