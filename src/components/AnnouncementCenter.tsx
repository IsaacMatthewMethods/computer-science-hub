import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Megaphone,
  Plus,
  Pin,
  Calendar,
  User,
  AlertTriangle,
  Info,
  Clock,
  BookOpen,
  Bell,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high" | "urgent";
  is_pinned: boolean;
  course_name?: string;
  course_code?: string;
  course_id?: string;
  author_name: string;
  created_at: string;
  expires_at?: string;
}

interface Course {
  id: string;
  name: string;
  course_code: string;
}

interface AnnouncementCenterProps {
  userType: "student" | "lecturer";
}

export const AnnouncementCenter = ({ userType }: AnnouncementCenterProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    priority: "medium" as const,
    course_id: "",
    is_pinned: false,
    expires_at: "",
  });

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
      if (userType === "lecturer") {
        fetchCourses();
      }
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("announcements")
        .select(`
          id,
          title,
          content,
          priority,
          is_pinned,
          course_id,
          created_at,
          expires_at,
          profiles:author_id (
            first_name,
            last_name
          ),
          courses:course_id (
            name,
            course_code
          )
        `)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      // Filter expired announcements
      query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      const { data, error } = await query;
      if (error) throw error;

      const formattedAnnouncements: Announcement[] = data?.map((announcement: any) => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        is_pinned: announcement.is_pinned,
        course_name: announcement.courses?.name,
        course_code: announcement.courses?.course_code,
        course_id: announcement.course_id,
        author_name: announcement.profiles 
          ? `${announcement.profiles.first_name || ""} ${announcement.profiles.last_name || ""}`.trim() || "Unknown Author"
          : "Unknown Author",
        created_at: announcement.created_at,
        expires_at: announcement.expires_at,
      })) || [];

      setAnnouncements(formattedAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, name, course_code")
        .eq("lecturer_id", user?.id)
        .eq("is_active", true);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("announcements-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        (payload) => {
          console.log("Announcement update:", payload);
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCreateAnnouncement = async () => {
    if (!user || userType !== "lecturer") return;

    try {
      const { data, error } = await supabase
        .from("announcements")
        .insert({
          ...newAnnouncement,
          author_id: user.id,
          course_id: newAnnouncement.course_id || null,
          expires_at: newAnnouncement.expires_at || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement created successfully",
      });

      setShowCreateDialog(false);
      setNewAnnouncement({
        title: "",
        content: "",
        priority: "medium",
        course_id: "",
        is_pinned: false,
        expires_at: "",
      });
      await fetchAnnouncements();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    }
  };

  const handleTogglePin = async (announcementId: string, currentStatus: boolean) => {
    if (userType !== "lecturer") return;

    try {
      await supabase
        .from("announcements")
        .update({ is_pinned: !currentStatus })
        .eq("id", announcementId);

      toast({
        title: "Success",
        description: `Announcement ${!currentStatus ? "pinned" : "unpinned"}`,
      });

      await fetchAnnouncements();
    } catch (error) {
      console.error("Error toggling pin status:", error);
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: "destructive",
      high: "destructive",
      medium: "default",
      low: "secondary",
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants] || "secondary"}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "1 day ago";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const pinnedAnnouncements = announcements.filter(a => a.is_pinned);
  const regularAnnouncements = announcements.filter(a => !a.is_pinned);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Announcements</h1>
        </div>
        {userType === "lecturer" && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Share important information with your students
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Course (Optional)</label>
                    <select
                      value={newAnnouncement.course_id}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, course_id: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All Courses (Global)</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <select
                      value={newAnnouncement.priority}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Announcement content"
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Expires At (Optional)</label>
                    <Input
                      type="datetime-local"
                      value={newAnnouncement.expires_at}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, expires_at: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_pinned"
                      checked={newAnnouncement.is_pinned}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, is_pinned: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <label htmlFor="is_pinned" className="text-sm font-medium">
                      Pin announcement
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAnnouncement} 
                    disabled={!newAnnouncement.title || !newAnnouncement.content}
                  >
                    Create Announcement
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned Announcements */}
          {pinnedAnnouncements.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Pin className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Pinned Announcements</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="border-l-4 border-l-primary hover-lift">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getPriorityIcon(announcement.priority)}
                            <CardTitle className="text-lg truncate">{announcement.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{announcement.author_name}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{formatTimeAgo(announcement.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(announcement.priority)}
                          {userType === "lecturer" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTogglePin(announcement.id, announcement.is_pinned)}
                            >
                              <Pin className="h-4 w-4 fill-current" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {announcement.course_name && (
                        <Badge variant="outline" className="mb-2">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {announcement.course_code} - {announcement.course_name}
                        </Badge>
                      )}
                      
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {announcement.content}
                      </p>
                      
                      {announcement.expires_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Expires {new Date(announcement.expires_at).toLocaleDateString()}</span>
                        </div>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            Read More
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{announcement.title}</DialogTitle>
                            <DialogDescription>
                              By {announcement.author_name} • {formatTimeAgo(announcement.created_at)}
                              {announcement.course_name && ` • ${announcement.course_code}`}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              {getPriorityIcon(announcement.priority)}
                              {getPriorityBadge(announcement.priority)}
                              {announcement.is_pinned && (
                                <Badge variant="secondary">
                                  <Pin className="h-3 w-3 mr-1" />
                                  Pinned
                                </Badge>
                              )}
                            </div>
                            <Separator />
                            <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Regular Announcements */}
          <div className="space-y-4">
            {pinnedAnnouncements.length > 0 && (
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Recent Announcements</h2>
              </div>
            )}
            
            {regularAnnouncements.length === 0 && pinnedAnnouncements.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
                    <p className="text-muted-foreground">
                      {userType === "lecturer" 
                        ? "Create your first announcement to share with students" 
                        : "Check back later for updates from your instructors"
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {regularAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="hover-lift">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getPriorityIcon(announcement.priority)}
                            <h3 className="font-semibold truncate">{announcement.title}</h3>
                            {getPriorityBadge(announcement.priority)}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <User className="h-3 w-3" />
                            <span>{announcement.author_name}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{formatTimeAgo(announcement.created_at)}</span>
                            {announcement.course_name && (
                              <>
                                <span>•</span>
                                <BookOpen className="h-3 w-3" />
                                <span>{announcement.course_code}</span>
                              </>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {announcement.content}
                          </p>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Read More
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{announcement.title}</DialogTitle>
                                <DialogDescription>
                                  By {announcement.author_name} • {formatTimeAgo(announcement.created_at)}
                                  {announcement.course_name && ` • ${announcement.course_code}`}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  {getPriorityIcon(announcement.priority)}
                                  {getPriorityBadge(announcement.priority)}
                                </div>
                                <Separator />
                                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        {userType === "lecturer" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePin(announcement.id, announcement.is_pinned)}
                          >
                            <Pin className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};