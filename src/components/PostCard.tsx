import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, ExternalLink, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Post, PostComment, usePosts } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const { likePost, addComment } = usePosts();

  const handleLike = () => {
    likePost(post.id);
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await addComment(post.id, newComment);
      setNewComment("");
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Get author data for each comment
      const commentsWithAuthors = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', comment.author_id)
            .single();

          return {
            ...comment,
            author: authorData || undefined
          };
        })
      );
      
      setComments(commentsWithAuthors);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      loadComments();
    }
  };

  const getMediaUrl = (filePath: string) => {
    const { data } = supabase.storage.from('files').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const downloadFile = async (filePath: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const renderContent = () => {
    switch (post.post_type) {
      case 'text':
        return <p className="text-foreground whitespace-pre-wrap">{post.content}</p>;
      
      case 'link':
        return (
          <div className="space-y-2">
            {post.content && <p className="text-foreground whitespace-pre-wrap">{post.content}</p>}
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={post.link_url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  {post.link_title || post.link_url}
                </a>
              </div>
              {post.link_description && (
                <p className="text-sm text-muted-foreground">{post.link_description}</p>
              )}
            </div>
          </div>
        );
      
      default:
        return post.content && <p className="text-foreground whitespace-pre-wrap">{post.content}</p>;
    }
  };

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        {post.media.map((media) => {
          const mediaUrl = getMediaUrl(media.file_path);
          
          if (media.file_type === 'image') {
            return (
              <div key={media.id} className="rounded-lg overflow-hidden">
                <img 
                  src={mediaUrl} 
                  alt={media.filename}
                  className="w-full max-h-96 object-cover"
                />
                <div className="text-xs text-muted-foreground p-2 bg-muted">
                  Uploaded by {post.author?.full_name || 'Unknown User'}
                </div>
              </div>
            );
          }
          
          if (media.file_type === 'video') {
            return (
              <div key={media.id} className="rounded-lg overflow-hidden">
                <video 
                  src={mediaUrl} 
                  controls 
                  className="w-full max-h-96"
                  poster={undefined}
                />
                <div className="text-xs text-muted-foreground p-2 bg-muted">
                  Uploaded by {post.author?.full_name || 'Unknown User'}
                </div>
              </div>
            );
          }
          
          return (
            <div 
              key={media.id} 
              className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
            >
              <div>
                <p className="font-medium text-sm">{media.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {(media.file_size && (media.file_size / 1024 / 1024).toFixed(2))} MB • 
                  Uploaded by {post.author?.full_name || 'Unknown User'}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadFile(media.file_path, media.filename)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author?.avatar_url || undefined} />
            <AvatarFallback>
              {post.author?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{post.author?.full_name || 'Unknown User'}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderContent()}
        {renderMedia()}
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="w-full space-y-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-2 ${post.user_liked ? 'text-red-500' : ''}`}
            >
              <Heart className={`h-4 w-4 ${post.user_liked ? 'fill-current' : ''}`} />
              {post.likes_count || 0}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleComments}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {post.comments_count || 0}
            </Button>
          </div>
          
          {showComments && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button 
                  onClick={handleComment}
                  disabled={!newComment.trim()}
                  size="sm"
                >
                  Post
                </Button>
              </div>
              
              {loadingComments ? (
                <div className="text-center text-sm text-muted-foreground">Loading comments...</div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author?.avatar_url || undefined} />
                        <AvatarFallback>
                          {comment.author?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3">
                          <p className="font-semibold text-sm">{comment.author?.full_name || 'Unknown User'}</p>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};