import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Upload, Loader2, FileUp, Lightbulb, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxAIChatbot() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: userProfile } = useQuery({
    queryKey: ['taxProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.TaxProfile.list();
      return profiles[0];
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await base44.functions.invoke('taxAIChatbot', {
        message: userMsg,
        conversation_history: messages,
        user_profile: userProfile
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
        sources: response.data.sources
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: `Fehler: ${error.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Upload file
      const uploadResponse = await base44.integrations.Core.UploadFile({
        file
      });

      setUploadedFile({
        name: file.name,
        type: file.type,
        url: uploadResponse.file_url
      });

      // Analyze document
      const analysis = await base44.functions.invoke('analyzeTaxDocumentAI', {
        file_url: uploadResponse.file_url,
        document_type: 'receipt_or_invoice',
        country: userProfile?.primary_residence_country || 'DE'
      });

      setMessages(prev => [...prev, {
        role: 'system',
        content: `Dokument analysiert: ${file.name}`,
        analysis: analysis.data.analysis
      }]);

      // Show analysis results
      const resultMsg = `📄 **${file.name} analysiert**\n\n**Dokumenttyp:** ${analysis.data.analysis.document_type}\n**Betrag:** ${analysis.data.analysis.identified_amount} ${analysis.data.analysis.currency}\n\n**Abzugskategorien:** ${analysis.data.analysis.deduction_categories.join(', ')}\n\n**Empfehlungen:** ${analysis.data.analysis.recommendations}`;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: resultMsg,
        isAnalysis: true
      }]);
    } catch (error) {
      toast.error(`Upload fehlgeschlagen: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetTaxPlan = async () => {
    if (!userProfile) {
      toast.error('Steuerprofil erforderlich');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateTaxPlanAdvice', {
        annual_income: userProfile.estimated_annual_tax || 50000,
        income_sources: userProfile.income_sources || [],
        assets: userProfile.asset_categories || [],
        liabilities: [],
        tax_goals: ['minimize_taxes', 'optimize_structure'],
        country: userProfile.primary_residence_country,
        tax_year: new Date().getFullYear()
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🎯 **Personalisierter Steuerplan**\n\n${JSON.stringify(response.data.advice, null, 2)}`,
        isAdvice: true
      }]);
    } catch (error) {
      toast.error(`Planerstellung fehlgeschlagen: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-screen flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-light mb-2">Steuer-AI Chatbot</h1>
        <p className="text-slate-600">Fragen Sie nach Steuerthemen, laden Sie Dokumente hoch oder erhalten Sie einen personalisierten Plan</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mb-4">
          <TabsTrigger value="chat">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileUp className="w-4 h-4 mr-2" />
            Dokumente
          </TabsTrigger>
          <TabsTrigger value="planning">
            <Lightbulb className="w-4 h-4 mr-2" />
            Planung
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto opacity-20 mb-2" />
                    <p>Stellen Sie eine Steuerfrage 👋</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-slate-800 text-white'
                        : msg.role === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-slate-100 text-slate-900'
                    }`}>
                      {msg.content}
                      {msg.sources && (
                        <p className="text-xs opacity-60 mt-1">Quellen: {msg.sources.join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-4 py-2 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
            <div className="border-t border-slate-200 p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ihre Steuerfrage..."
                  disabled={loading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-slate-800 hover:bg-slate-900"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Dokumente hochladen</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <FileUp className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  Laden Sie Quittungen, Rechnungen oder andere Dokumente hoch. Die KI analysiert diese auf mögliche Steuerabzüge.
                </AlertDescription>
              </Alert>

              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-8">
                <label className="cursor-pointer w-full">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <div className="text-center">
                    <FileUp className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                    <p className="text-slate-600">Datei hierher ziehen oder klicken</p>
                    <p className="text-xs text-slate-500">PDF, JPG, PNG (max 10MB)</p>
                  </div>
                </label>
              </div>

              {uploadedFile && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">✓ {uploadedFile.name} hochgeladen</p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-3">
                {messages
                  .filter(m => m.isAnalysis)
                  .map((msg, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning" className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Personalisierter Steuerplan</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  Erhalten Sie einen personalisierten Steuerplan basierend auf Ihrem Profil und Ihren Zielen.
                </AlertDescription>
              </Alert>

              <div className="flex-1 flex items-center justify-center">
                {messages.filter(m => m.isAdvice).length === 0 ? (
                  <div className="text-center">
                    <Lightbulb className="w-12 h-12 mx-auto text-slate-400 mb-2 opacity-20" />
                    <p className="text-slate-600">Erstellen Sie einen personalisierten Plan</p>
                  </div>
                ) : (
                  <div className="w-full space-y-3 overflow-y-auto">
                    {messages
                      .filter(m => m.isAdvice)
                      .map((msg, idx) => (
                        <Card key={idx}>
                          <CardContent className="pt-4">
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleGetTaxPlan}
                disabled={loading || !userProfile}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  'Plan erstellen'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}