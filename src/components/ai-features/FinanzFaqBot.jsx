import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HelpCircle, Send, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AIUsageIndicator from '../ai/AIUsageIndicator';
import AICostDisplay from '../ai/AICostDisplay';

export default function FinanzFaqBot() {
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    async function loadUser() {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
    }

    const handleAsk = async () => {
        if (!input.trim() || loading) return;

        setLoading(true);
        const question = input;
        setInput('');

        try {
            const newHistory = [...history, { role: 'user', content: question }];
            const response = await base44.functions.invoke('aiCoreService', {
                action: 'chat',
                prompt: `Konversation: ${JSON.stringify(newHistory)}. Beantworte die letzte Frage.`,
                systemPrompt: 'Du bist ein Experte für Immobilien, Finanzen, Steuern und Mietrecht. Beantworte Fragen präzise und verständlich.',
                userId: user?.email,
                featureKey: 'chat',
                maxTokens: 2048
            });

            if (response.data.success) {
                setHistory([...newHistory, { 
                    role: 'assistant', 
                    content: response.data.content,
                    usage: response.data.usage
                }]);
            } else {
                toast.error(response.data.error || 'Fehler beim Senden');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="h-[600px] flex flex-col">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="w-5 h-5" />
                            <span className="font-semibold">Finanz-FAQ-Bot</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {user && <AIUsageIndicator userId={user.email} />}
                            <Button variant="outline" size="sm" onClick={() => setHistory([])}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Zurücksetzen
                            </Button>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600">Stelle Fragen zu Finanzen, Steuern und Mietrecht</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                        {history.length === 0 && (
                            <div className="text-center text-slate-500 py-8">
                                Stelle eine Frage und ich helfe dir weiter!
                            </div>
                        )}
                        {history.map((msg, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                                            msg.role === 'user'
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-slate-100 text-slate-900'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                                {msg.role === 'assistant' && msg.usage && (
                                    <div className="flex justify-start">
                                        <AICostDisplay usage={msg.usage} />
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 p-3 rounded-lg">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="flex gap-2 border-t pt-4">
                        <Input
                            placeholder="Deine Frage eingeben..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                            disabled={loading}
                        />
                        <Button onClick={handleAsk} disabled={loading || !input.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}