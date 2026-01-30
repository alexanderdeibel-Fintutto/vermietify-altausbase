import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from "@/components/ui/scroll-area";
import AIUsageIndicator from './AIUsageIndicator';
import AICostDisplay from './AICostDisplay';

const AIChatPanel = ({ isOpen, onClose, currentPage, contextData }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  }

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { role: 'assistant', content: 'Hallo! Ich bin Ihr VermieterPro Assistent. Wie kann ich Ihnen heute helfen?' }
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if(viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const systemPrompt = `Du bist der VermieterPro KI-Assistent, spezialisiert auf:\n- Deutsche, österreichische und Schweizer Immobilienverwaltung\n- Mietrecht (BGB §§535-580a, MRG, OR)\n- Betriebskostenabrechnung (BetrKV)\n- Steuerliche Aspekte (Anlage V, AfA, EÜR)\n\nDEINE ROLLE:\n- Hilfreich, präzise, rechtlich korrekt\n- Immer auf Deutsch antworten (es sei denn anders gewünscht)\n- Bei rechtlichen Fragen: Hinweis auf Steuerberater/Rechtsanwalt\n- Nie falsche Rechtsauskunft geben\n\nKONTEXT-AWARENESS:\nDu erhältst immer Kontext über:\n- Aktuelle Seite des Nutzers\n- Relevante Daten (Mieter, Gebäude, Verträge)\n\nANTWORT-STIL:\n- Kurz und prägnant (max. 3-4 Sätze für einfache Fragen)\n- Strukturiert bei komplexen Themen\n- Immer mit praktischem Bezug zur App\n\nDu bist im Chat-Modus. Der Nutzer kann frei Fragen stellen.\nFOKUS:\n- Beantworte Fragen zur App-Nutzung\n- Erkläre Mietrecht-Themen\n- Hilf bei Problemen und Fehlern\n- Schlage nächste Schritte vor`;
      
      const contextInfo = contextData ? `\n\nSeite: ${currentPage}\nKontext: ${JSON.stringify(contextData)}` : '';
      
      const response = await base44.functions.invoke('aiCoreService', {
        action: 'chat',
        prompt: userMessage.content + contextInfo,
        systemPrompt,
        userId: user?.email,
        featureKey: 'chat',
        maxTokens: 2048
      });

      const assistantMessage = { 
        role: 'assistant', 
        content: response.data.content,
        usage: response.data.usage
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error calling AI:", error);
      const errorMessage = { role: 'assistant', content: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const Message = ({ message }) => {
    const isAssistant = message.role === 'assistant';
    return (
      <div className={`flex flex-col ${!isAssistant && 'items-end'}`}>
        <div className={`flex items-start gap-3 my-4 ${!isAssistant && 'justify-end'}`}>
          {isAssistant && <div className="bg-gray-200 p-2 rounded-full"><Bot className="h-5 w-5 text-gray-600" /></div>}
          <div className={`p-3 rounded-lg max-w-[80%] ${isAssistant ? 'bg-gray-100 text-gray-800' : 'bg-blue-500 text-white'}`}>
            <ReactMarkdown className="prose prose-sm max-w-none">{message.content}</ReactMarkdown>
          </div>
          {!isAssistant && <div className="bg-blue-200 p-2 rounded-full"><User className="h-5 w-5 text-blue-600" /></div>}
        </div>
        {isAssistant && message.usage && (
          <div className="ml-14 mb-2">
            <AICostDisplay usage={message.usage} />
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0 z-[100]">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>VermieterPro Assistent</SheetTitle>
              <SheetDescription>Frag mich alles zur Vermietung</SheetDescription>
            </div>
            {user && <AIUsageIndicator userId={user.email} />}
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="py-4">
            {messages.map((msg, index) => (
              <Message key={index} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 my-4">
                <div className="bg-gray-200 p-2 rounded-full"><Bot className="h-5 w-5 text-gray-600" /></div>
                <div className="p-3 rounded-lg bg-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-white">
          <div className="relative">
            <Textarea
              placeholder="Ihre Frage..."
              className="pr-16"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={handleSendMessage}
              disabled={isLoading || inputValue.trim() === ''}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AIChatPanel;