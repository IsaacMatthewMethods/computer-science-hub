import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Post {
  id: string;
  author_id: string;
  content: string | null;
  post_type: "text" | "image" | "video" | "link" | "file";
  link_url: string | null;
  link_title: string | null;
  link_description: string | null;
  is_public: boolean;
  course_id: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  media?: PostMedia[];
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
}

export interface PostMedia {
  id: string;
  post_id: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  filename: string;
  mime_type: string | null;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch posts first
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get additional data for each post
      const postsWithData = await Promise.all(
        (postsData || []).map(async (post) => {
          // Get author profile
          const { data: authorData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', post.author_id)
            .single();

          // Get media
          const { data: mediaData } = await supabase
            .from('post_media')
            .select('*')
            .eq('post_id', post.id);

          // Get likes count
          const { count: likesCount } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          // Get comments count  
          const { count: commentsCount } = await supabase
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          // Check if user liked this post
          let userLiked = false;
          if (user) {
            const { data: userLike } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();

            userLiked = !!userLike;
          }

          return {
            ...post,
            author: authorData || undefined,
            media: mediaData || [],
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            user_liked: userLiked,
            post_type: post.post_type as "text" | "image" | "video" | "link" | "file"
          };
        })
      );

      setPosts(postsWithData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: {
    content?: string;
    post_type: string;
    link_url?: string;
    link_title?: string;
    link_description?: string;
    is_public?: boolean;
    course_id?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...postData,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    await fetchPosts();
    return data;
  };

  const likePost = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.user_liked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });
      }

      // Update local state
      setPosts(posts.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              user_liked: !p.user_liked,
              likes_count: p.user_liked ? (p.likes_count || 0) - 1 : (p.likes_count || 0) + 1
            }
          : p
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
      });

    if (error) throw error;

    await fetchPosts();
  };

  const uploadMedia = async (postId: string, files: FileList) => {
    if (!user) throw new Error('User not authenticated');

    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `posts/${postId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('post_media')
        .insert({
          post_id: postId,
          file_path: filePath,
          file_type: file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' : 'file',
          file_size: file.size,
          filename: file.name,
          mime_type: file.type,
        });

      if (insertError) throw insertError;
    });

    await Promise.all(uploadPromises);
    await fetchPosts();
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  return {
    posts,
    loading,
    createPost,
    likePost,
    addComment,
    uploadMedia,
    refetch: fetchPosts,
  };
};