import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageIcon, VideoIcon, Link2Icon, FileIcon, Type } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { toast } from "sonner";

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

export const CreatePostForm = ({ onPostCreated }: CreatePostFormProps) => {
  const [postType, setPostType] = useState<"text" | "image" | "video" | "link" | "file">("text");
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [files, setFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createPost, uploadMedia } = usePosts();

  const resetForm = () => {
    setContent("");
    setLinkUrl("");
    setLinkTitle("");
    setLinkDescription("");
    setFiles(null);
    setPostType("text");
    setIsPublic(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && postType === "text") {
      toast.error("Please enter some content");
      return;
    }
    
    if (postType === "link" && !linkUrl.trim()) {
      toast.error("Please enter a link URL");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const postData: any = {
        post_type: postType,
        is_public: isPublic,
      };

      if (content.trim()) {
        postData.content = content;
      }

      if (postType === "link") {
        postData.link_url = linkUrl;
        postData.link_title = linkTitle || null;
        postData.link_description = linkDescription || null;
      }

      const newPost = await createPost(postData);

      // Upload files if any
      if (files && files.length > 0 && (postType === "image" || postType === "video" || postType === "file")) {
        await uploadMedia(newPost.id, files);
      }

      toast.success("Post created successfully!");
      resetForm();
      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const postTypeOptions = [
    { value: "text", label: "Text Post", icon: Type },
    { value: "image", label: "Image Post", icon: ImageIcon },
    { value: "video", label: "Video Post", icon: VideoIcon },
    { value: "link", label: "Link Post", icon: Link2Icon },
    { value: "file", label: "File Post", icon: FileIcon },
  ];

  const selectedPostType = postTypeOptions.find(option => option.value === postType);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {selectedPostType && <selectedPostType.icon className="h-5 w-5" />}
          Create New Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="post-type">Post Type</Label>
            <Select value={postType} onValueChange={(value: any) => setPostType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent>
                {postTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder={postType === "link" ? "Add a description (optional)" : "What's on your mind?"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required={postType === "text"}
            />
          </div>

          {postType === "link" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="link-url">Link URL *</Label>
                <Input
                  id="link-url"
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="link-title">Link Title</Label>
                <Input
                  id="link-title"
                  placeholder="Optional title for the link"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="link-description">Link Description</Label>
                <Textarea
                  id="link-description"
                  placeholder="Optional description for the link"
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {(postType === "image" || postType === "video" || postType === "file") && (
            <div>
              <Label htmlFor="files">
                Upload {postType === "image" ? "Images" : postType === "video" ? "Videos" : "Files"}
              </Label>
              <Input
                id="files"
                type="file"
                onChange={(e) => setFiles(e.target.files)}
                multiple
                accept={
                  postType === "image" 
                    ? "image/*" 
                    : postType === "video" 
                    ? "video/*" 
                    : "*/*"
                }
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="is-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="is-public">Make this post public</Label>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating Post..." : "Create Post"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};