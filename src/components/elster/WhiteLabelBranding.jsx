import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Palette, Upload, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function WhiteLabelBranding() {
  const [branding, setBranding] = useState({
    company_name: 'Mustermann Steuerberatung',
    logo_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#10b981',
    email_footer: 'Mit freundlichen Grüßen\nIhr Steuerberater-Team'
  });

  const handleSave = () => {
    toast.success('Branding gespeichert');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" />
          White-Label Branding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label>Firmenname</Label>
            <Input
              value={branding.company_name}
              onChange={(e) => setBranding({...branding, company_name: e.target.value})}
              placeholder="Ihre Kanzlei"
            />
          </div>

          <div>
            <Label>Logo</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={branding.logo_url}
                onChange={(e) => setBranding({...branding, logo_url: e.target.value})}
                placeholder="Logo URL"
                className="flex-1"
              />
              <Button size="icon" variant="outline">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Primärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) => setBranding({...branding, primary_color: e.target.value})}
                  className="w-16 h-10"
                />
                <Input
                  value={branding.primary_color}
                  onChange={(e) => setBranding({...branding, primary_color: e.target.value})}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Sekundärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({...branding, secondary_color: e.target.value})}
                  className="w-16 h-10"
                />
                <Input
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({...branding, secondary_color: e.target.value})}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label>E-Mail Footer</Label>
            <textarea
              value={branding.email_footer}
              onChange={(e) => setBranding({...branding, email_footer: e.target.value})}
              className="w-full min-h-[100px] p-2 border rounded-lg"
              placeholder="E-Mail Signatur"
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Branding speichern
        </Button>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-2">Vorschau</div>
          <div className="p-3 bg-white rounded" style={{ borderTop: `3px solid ${branding.primary_color}` }}>
            <div className="font-bold" style={{ color: branding.primary_color }}>
              {branding.company_name}
            </div>
            <div className="text-sm text-slate-600 mt-2">
              {branding.email_footer}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}