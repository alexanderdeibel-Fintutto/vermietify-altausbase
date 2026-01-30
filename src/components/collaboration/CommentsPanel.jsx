import React, { useState } from 'react';
import { MessageCircle, Send, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export default function CommentsPanel({ comments = [], onAdd, onDelete, currentUser }) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd(newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Kommentare ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Kommentar hinzufügen..."
            className="min-h-20"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
              className="gap-2"
            >
              <Send className="w-3 h-3" />
              Senden
            </Button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {comments.map((comment, idx) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                      {comment.user?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {comment.user || 'Unbekannt'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_date), { 
                          addSuffix: true, 
                          locale: de 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {onDelete && comment.created_by === currentUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => onDelete(comment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>

          {comments.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
              Noch keine Kommentare vorhanden
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}