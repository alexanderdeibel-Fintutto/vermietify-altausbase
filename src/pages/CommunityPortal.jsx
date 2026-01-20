import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { MessageSquare, Send, ThumbsUp, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function CommunityPortal() {
    const [newPost, setNewPost] = useState('');
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const { data: posts = [] } = useQuery({
        queryKey: ['communityPosts'],
        queryFn: () => base44.entities.CommunityPost.list('-created_date', 20)
    });

    const createPostMutation = useMutation({
        mutationFn: (content) => base44.entities.CommunityPost.create({
            content,
            author_email: user?.email,
            author_name: user?.full_name
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
            setNewPost('');
            showSuccess('Beitrag veröffentlicht');
        }
    });

    const handlePost = () => {
        if (!newPost.trim()) return;
        createPostMutation.mutate(newPost);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Mieter-Community</h1>
                    <p className="vf-page-subtitle">Austausch & Ankündigungen</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <VfTextarea
                        placeholder="Was gibt's Neues? Teilen Sie Ihre Gedanken..."
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        rows={3}
                    />
                    <div className="flex justify-end mt-3">
                        <Button onClick={handlePost} className="vf-btn-gradient">
                            <Send className="w-4 h-4" />
                            Veröffentlichen
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {posts.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <MessageSquare className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold mb-2">Noch keine Beiträge</h3>
                        <p className="text-gray-600">Seien Sie der Erste, der etwas teilt!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <Card key={post.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                        {post.author_name?.charAt(0) || 'M'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold">{post.author_name || 'Anonym'}</span>
                                            <span className="text-sm text-gray-500">
                                                • {new Date(post.created_date).toLocaleDateString('de-DE')}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 mb-4">{post.content}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <button className="flex items-center gap-1 hover:text-blue-600">
                                                <ThumbsUp className="w-4 h-4" />
                                                <span>{post.likes_count || 0}</span>
                                            </button>
                                            <button className="flex items-center gap-1 hover:text-blue-600">
                                                <MessageCircle className="w-4 h-4" />
                                                <span>{post.comments_count || 0}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}