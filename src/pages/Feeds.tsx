import { useState } from "react";
import { CreatePostForm } from "@/components/CreatePostForm";
import { PostCard } from "@/components/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const Feeds = () => {
  const { posts, loading, refetch } = usePosts();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handlePostCreated = () => {
    setShowCreateForm(false);
    refetch();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-8">Student Feeds</h1>
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Student Feeds</h1>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <CreatePostForm onPostCreated={handlePostCreated} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-foreground mb-2">No posts yet</h2>
              <p className="text-muted-foreground mb-4">
                Be the first to share something with the community!
              </p>
              <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Your First Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CreatePostForm onPostCreated={handlePostCreated} />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Feeds;