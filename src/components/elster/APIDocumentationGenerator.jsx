import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, Download, BookOpen, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function APIDocumentationGenerator() {
  const [copied, setCopied] = useState('');

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    toast.success('Code kopiert');
    setTimeout(() => setCopied(''), 2000);
  };

  const endpoints = [
    {
      id: 'generate',
      method: 'POST',
      path: '/api/elster/generate',
      description: 'Generiert ein Steuerformular mit KI',
      request: `{
  "building_id": "abc123",
  "form_type": "ANLAGE_V",
  "tax_year": 2024
}`,
      response: `{
  "success": true,
  "submission_id": "sub_xyz789",
  "ai_confidence_score": 92
}`
    },
    {
      id: 'validate',
      method: 'POST',
      path: '/api/elster/validate',
      description: 'Validiert ein Formular',
      request: `{
  "submission_id": "sub_xyz789"
}`,
      response: `{
  "valid": true,
  "errors": [],
  "warnings": ["Kleinere Abweichung"]
}`
    },
    {
      id: 'submit',
      method: 'POST',
      path: '/api/elster/submit',
      description: 'Reicht Formular bei ELSTER ein',
      request: `{
  "submission_id": "sub_xyz789",
  "mode": "TEST"
}`,
      response: `{
  "success": true,
  "transfer_ticket": "TT123456"
}`
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600" />
          API-Dokumentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue={endpoints[0].id}>
          <TabsList className="grid w-full grid-cols-3">
            {endpoints.map(ep => (
              <TabsTrigger key={ep.id} value={ep.id}>
                {ep.method}
              </TabsTrigger>
            ))}
          </TabsList>

          {endpoints.map(endpoint => (
            <TabsContent key={endpoint.id} value={endpoint.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {endpoint.method}
                </Badge>
                <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                  {endpoint.path}
                </code>
              </div>

              <div className="text-sm text-slate-700">
                {endpoint.description}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Request:</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(endpoint.request, `req-${endpoint.id}`)}
                  >
                    {copied === `req-${endpoint.id}` ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                  {endpoint.request}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Response:</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(endpoint.response, `res-${endpoint.id}`)}
                  >
                    {copied === `res-${endpoint.id}` ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                  {endpoint.response}
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Button variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          OpenAPI Spec herunterladen
        </Button>
      </CardContent>
    </Card>
  );
}