import { ChatSystem } from "./ChatSystem";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  Download,
  MessageSquare,
  Clock,
  TrendingUp,
  Users,
  FileText,
  Video,
  Image,
  Calendar,
  Bell,
  Star,
} from "lucide-react";

export function StudentDashboard() {
  const { user } = useAuth();
  const [progressValue, setProgressValue] = useState(0);
  const [userName, setUserName] = useState("");
  const [resourcesDownloaded, setResourcesDownloaded] = useState(0);
  const [chatMessages, setChatMessages] = useState(0);
  const [collaborationHours, setCollaborationHours] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgressValue(75), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        // Fetch user name
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profile) {
          setUserName(`${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Student");
        }

        // Fetch resources downloaded (assuming files table has a download_count and uploaded_by)
        const { data: filesData, error: filesError } = await supabase
          .from("files")
          .select("download_count")
          .eq("uploaded_by", user.id);

        if (filesError) {
          console.error("Error fetching files data:", filesError);
        } else if (filesData) {
          const totalDownloads = filesData.reduce((sum, file) => sum + file.download_count, 0);
          setResourcesDownloaded(totalDownloads);
        }

        try {
          // Fetch chat messages (assuming messages table has sender_id)
          const { count: messagesCount, error: messagesError } = await supabase
            .from("messages")
            .select("id", { count: 'exact' })
            .eq("sender_id", user.id);

          if (messagesError) {
            console.error("Error fetching messages count:", JSON.stringify(messagesError, null, 2));
          } else if (messagesCount !== null) {
            setChatMessages(messagesCount);
          }
        } catch (error) {
          console.error("An unexpected error occurred while fetching messages count:", error);
        }

        // Placeholder for Collaboration Hours - needs a table to track collaboration activities
        // For now, using a static value or a simple calculation if a relevant table exists
        setCollaborationHours(24); // Static placeholder
      }
    };

    fetchData();
  }, [user]);

  const recentActivity = [
    {
      id: 1,
      type: "download",
      title: "Data Structures Lecture Notes",
      time: "2 hours ago",
      icon: Download,
      color: "text-blue-500",
    },
    {
      id: 2,
      type: "message",
      title: "New message from Dr. Smith",
      time: "4 hours ago",
      icon: MessageSquare,
      color: "text-green-500",
    },
    {
      id: 3,
      type: "upload",
      title: "Assignment submitted",
      time: "1 day ago",
      icon: FileText,
      color: "text-purple-500",
    },
  ];

  const upcomingDeadlines = [
    {
      id: 1,
      title: "Algorithms Assignment",
      due: "Tomorrow",
      course: "CS 301",
      priority: "high",
    },
    {
      id: 2,
      title: "Database Project",
      due: "3 days",
      course: "CS 401",
      priority: "medium",
    },
    {
      id: 3,
      title: "Machine Learning Quiz",
      due: "1 week",
      course: "CS 502",
      priority: "low",
    },
  ];

  const quickStats = [
    {
      label: "Resources Downloaded",
      value: resourcesDownloaded.toString(),
      icon: Download,
      trend: "+12%",
      color: "text-blue-500",
    },
    {
      label: "Assignments Completed",
      value: "18", // Static for now, needs a table to track assignments
      icon: FileText,
      trend: "+8%",
      color: "text-green-500",
    },
    {
      label: "Chat Messages",
      value: chatMessages.toString(),
      icon: MessageSquare,
      trend: "+25%",
      color: "text-purple-500",
    },
    {
      label: "Collaboration Hours",
      value: collaborationHours.toString(),
      icon: Users,
      trend: "+15%",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-primary rounded-lg p-6 text-primary-foreground shadow-medium">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {userName}! 👋
            </h1>
            <p className="text-primary-foreground/80">
              You have 3 upcoming deadlines and 2 new resources available
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-primary-foreground/60">Overall Progress</p>
              <div className="w-32 mt-2">
                <Progress value={progressValue} className="h-2" />
              </div>
              <p className="text-sm mt-1">{progressValue}% Complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.label} 
              className={`hover-lift shadow-soft animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className={`text-xs ${stat.color} flex items-center mt-1`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.trend}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 hover-lift shadow-soft animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest interactions and downloads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-all duration-200"
                  >
                    <div className={`p-2 rounded-full bg-accent`}>
                      <Icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="hover-lift shadow-soft animate-scale-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-destructive" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>
              Don't miss these important dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline) => (
                <div 
                  key={deadline.id} 
                  className="p-3 rounded-lg border border-border hover:bg-accent/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{deadline.title}</p>
                    <Badge 
                      variant={
                        deadline.priority === "high" 
                          ? "destructive" 
                          : deadline.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {deadline.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {deadline.course}
                  </p>
                  <p className="text-xs font-medium text-destructive">
                    Due in {deadline.due}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="hover-lift shadow-soft animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary" />
            Chat
          </CardTitle>
          <CardDescription>
            Real-time chat with students and lecturers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatSystem userType="student" userName={userName} user={user} />
        </CardContent>
      </Card>
    </div>
  );
}