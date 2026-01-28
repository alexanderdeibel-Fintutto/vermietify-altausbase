import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, sendImageMessage, subscribeToConversation } from '../services/messaging';
import { Button } from '@/components/ui/button';
import { Send, Image as ImageIcon, Paperclip, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client'; // Keep for auth

export default function ChatView({ conversationId, conversation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    loadUser();
    loadMessages();
    
    const subscription = subscribeToConversation(conversationId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [conversationId]);
  
  async function loadUser() {
    const user = await base44.auth.me();
    setCurrentUser(user);
  }
  
  async function loadMessages() {
    setLoading(true);
    const data = await getMessages(conversationId);
    setMessages(data);
    setLoading(false);
    setTimeout(scrollToBottom, 100);
  }
  
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
  
  async function handleSend() {
    if (!input.trim() || sending) return;
    
    setSending(true);
    const result = await sendMessage(conversationId, input);
    setSending(false);
    
    if (result.success) {
      setInput('');
      scrollToBottom();
    }
  }
  
  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSending(true);
    await sendImageMessage(conversationId, file);
    setSending(false);
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h3 className="font-semibold text-lg">{conversation?.title || 'Chat'}</h3>
        {conversation?.unit_id && (
          <p className="text-sm text-gray-500">Einheit: {conversation.unit_id}</p>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            Noch keine Nachrichten
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isMe={currentUser?.id === msg.sender_id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Nachricht schreiben..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            size="icon"
            className="rounded-full"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isMe }) {
  const isSystem = message.content_type === 'system' || message.content_type === 'status';
  
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isMe ? 'bg-blue-600 text-white' : 'bg-white border'} rounded-2xl p-3 shadow-sm`}>
        {!isMe && (
          <div className="text-xs font-semibold mb-1 flex items-center gap-2">
            <span>{message.sender_name}</span>
            {message.sender_app && (
              <span className="text-gray-400 font-normal">
                · {message.sender_app === 'mieterapp' ? 'Mieter' : 'Vermieter'}
              </span>
            )}
          </div>
        )}
        
        {/* Bild-Anhang */}
        {message.content_type === 'image' && message.message_attachments?.[0] && (
          <img 
            src={message.message_attachments[0].file_url}
            alt="Bild"
            className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-90"
            onClick={() => window.open(message.message_attachments[0].file_url, '_blank')}
          />
        )}
        
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        
        <div className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
          {new Date(message.created_at).toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}