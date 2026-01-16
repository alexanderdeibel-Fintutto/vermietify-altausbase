import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SteuerAssistentChat() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hallo! Ich bin dein Steuer-Assistent. Für welches Jahr möchtest du die Steuererklärung machen?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await base44.functions.invoke('chatMitSteuerAssistent', {
                messages: [userMessage],
                conversationHistory: messages
            });

            if (response.data.success) {
                setMessages(response.data.updatedHistory);
            } else {
                toast.error(response.data.error || 'Fehler beim Senden');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setMessages([
            { role: 'assistant', content: 'Hallo! Ich bin dein Steuer-Assistent. Für welches Jahr möchtest du die Steuererklärung machen?' }
        ]);
        setInput('');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="h-[600px] flex flex-col">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Steuer-Assistent
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={handleReset}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Neustart
                        </Button>
                    </div>
                    <p className="text-sm text-slate-600">Ich führe dich durch deine Steuererklärung</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg ${
                                        msg.role === 'user'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-900'
                                    }`}
                                >
                                    {msg.content}
                                </div>
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
                            placeholder="Deine Antwort eingeben..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={loading}
                        />
                        <Button onClick={handleSend} disabled={loading || !input.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}