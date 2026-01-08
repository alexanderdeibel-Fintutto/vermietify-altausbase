import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCode, Eye, Download, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function FormTemplateManager() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['elster-templates'],
    queryFn: () => base44.entities.ElsterFormTemplate.list()
  });

  const seedTemplates = useMutation({
    mutationFn: (year) => base44.functions.invoke('seedElsterFormTemplates', { year }),
    onSuccess: (response) => {
      toast.success(response.data.message);
      queryClient.invalidateQueries({ queryKey: ['elster-templates'] });
    }
  });

  const formTypes = [...new Set(templates.map(t => t.form_type))];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Formular-Templates</CardTitle>
            <Button
              onClick={() => seedTemplates.mutate(new Date().getFullYear())}
              disabled={seedTemplates.isPending}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Templates neu laden
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={formTypes[0]} className="w-full">
            <TabsList>
              {formTypes.map(type => (
                <TabsTrigger key={type} value={type}>
                  {type}
                </TabsTrigger>
              ))}
            </TabsList>

            {formTypes.map(type => (
              <TabsContent key={type} value={type} className="mt-4">
                <div className="space-y-3">
                  {templates
                    .filter(t => t.form_type === type)
                    .map(template => (
                      <div
                        key={template.id}
                        className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{template.legal_form}</div>
                            <div className="text-sm text-slate-600">
                              Jahr: {template.year} | Version: {template.version || '1.0'}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={template.is_active ? 'default' : 'secondary'}>
                              {template.is_active ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.form_type} - {selectedTemplate?.legal_form}
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>XML-Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                    {selectedTemplate.xml_template}
                  </pre>
                </CardContent>
              </Card>

              {selectedTemplate.field_mappings && (
                <Card>
                  <CardHeader>
                    <CardTitle>Feld-Mappings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(selectedTemplate.field_mappings).map(([key, value]) => (
                        <div key={key} className="flex justify-between border-b pb-2">
                          <span className="font-mono text-sm">{key}</span>
                          <span className="text-sm text-slate-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}