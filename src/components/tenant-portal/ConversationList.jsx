import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, AlertCircle, FileText, Clock } from 'lucide-react';

export default function ConversationList({ conversations, onSelect, selectedId }) {
  const getConversationIcon = (type) => {
    switch (type) {
      case 'task': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'document': return <FileText className="w-5 h-5 text-blue-500" />;
      default: return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    return date.toLocaleDateString('de-DE');
  };
  
  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Keine Konversationen vorhanden</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {conversations.map(conv => {
        const isSelected = conv.id === selectedId;
        const hasUnread = conv.conversation_members?.[0]?.unread_count > 0;
        const lastMessage = conv.messages?.[0];
        
        return (
          <Card
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`p-4 cursor-pointer transition-all ${
              isSelected 
                ? 'border-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                {getConversationIcon(conv.conversation_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className={`font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                    {conv.title}
                  </h4>
                  {lastMessage && (
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTime(lastMessage.created_at)}
                    </span>
                  )}
                </div>
                
                {lastMessage && (
                  <p className={`text-sm truncate ${hasUnread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {lastMessage.sender_name}: {lastMessage.content}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  {conv.tasks?.[0] && (
                    <Badge variant="outline" className="text-xs">
                      {conv.tasks[0].status}
                    </Badge>
                  )}
                  {hasUnread && (
                    <Badge className="bg-blue-600 text-white text-xs">
                      {conv.conversation_members[0].unread_count} neu
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}