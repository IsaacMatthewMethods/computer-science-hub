import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ImprovedChatSystem } from "@/components/ImprovedChatSystem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Users,
  MessageSquare,
  BookOpen,
  TrendingUp,
  BarChart3,
  FileText,
  Video,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface LecturerDashboardProps {
  lecturerName?: string;
}

export function LecturerDashboard({ lecturerName = "Lecturer" }: LecturerDashboardProps) {
  const { user } = useAuth();
  const [engagementRate, setEngagementRate] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setEngagementRate(82), 500);
    return () => clearTimeout(timer);
  }, []);

  const quickStats = [
    {
      label: "Total Students",
      value: "247",
      icon: Users,
      trend: "+12",
      color: "text-blue-500",
    },
    {
      label: "Resources Shared",
      value: "89",
      icon: Upload,
      trend: "+8",
      color: "text-green-500",
    },
    {
      label: "Messages Today",
      value: "34",
      icon: MessageSquare,
      trend: "+15",
      color: "text-purple-500",
    },
    {
      label: "Active Courses",
      value: "6",
      icon: BookOpen,
      trend: "+2",
      color: "text-orange-500",
    },
  ];

  const recentUploads = [
    {
      id: 1,
      title: "Advanced Algorithms - Lecture 12",
      type: "video",
      course: "CS 401",
      uploads: 1,
      downloads: 23,
      time: "2 hours ago",
    },
    {
      id: 2,
      title: "Database Design Principles",
      type: "document",
      course: "CS 301",
      uploads: 1,
      downloads: 45,
      time: "5 hours ago",
    },
    {
      id: 3,
      title: "Machine Learning Assignment",
      type: "assignment",
      course: "CS 502",
      uploads: 1,
      downloads: 67,
      time: "1 day ago",
    },
  ];

  const courseEngagement = [
    { course: "CS 401", students: 89, engagement: 85, color: "bg-blue-500" },
    { course: "CS 301", students: 72, engagement: 78, color: "bg-green-500" },
    { course: "CS 502", students: 56, engagement: 91, color: "bg-purple-500" },
    { course: "CS 201", students: 94, engagement: 73, color: "bg-orange-500" },
  ];

  const pendingTasks = [
    {
      id: 1,
      task: "Grade CS 401 Assignments",
      count: 45,
      priority: "high",
      deadline: "Today",
    },
    {
      id: 2,
      task: "Review Project Proposals",
      count: 12,
      priority: "medium",
      deadline: "Tomorrow",
    },
    {
      id: 3,
      task: "Update Course Materials",
      count: 3,
      priority: "low",
      deadline: "This week",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-primary rounded-lg p-6 text-primary-foreground shadow-medium">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, Prof. {lecturerName}! 🎓
            </h1>
            <p className="text-primary-foreground/80">
              You have 45 assignments to grade and 3 new student messages
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-primary-foreground/60">Student Engagement</p>
              <div className="w-32 mt-2">
                <Progress value={engagementRate} className="h-2" />
              </div>
              <p className="text-sm mt-1">{engagementRate}% Active</p>
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
                      +{stat.trend} this week
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
        {/* Recent Uploads */}
        <Card className="lg:col-span-2 hover-lift shadow-soft animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2 text-primary" />
              Recent Resource Uploads
            </CardTitle>
            <CardDescription>
              Your latest shared materials and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUploads.map((upload) => (
                <div 
                  key={upload.id} 
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/30 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full bg-accent`}>
                      {upload.type === "video" ? (
                        <Video className="h-4 w-4 text-blue-500" />
                      ) : upload.type === "document" ? (
                        <FileText className="h-4 w-4 text-green-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{upload.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {upload.course} • {upload.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">
                      {upload.downloads} downloads
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="hover-lift shadow-soft animate-scale-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-warning" />
              Pending Tasks
            </CardTitle>
            <CardDescription>
              Items requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="p-3 rounded-lg border border-border hover:bg-accent/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">{task.task}</p>
                    <Badge 
                      variant={
                        task.priority === "high" 
                          ? "destructive" 
                          : task.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {task.count} items
                    </p>
                    <p className="text-xs font-medium text-destructive">
                      Due {task.deadline}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Engagement */}
      <Card className="hover-lift shadow-soft animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
            Course Engagement Overview
          </CardTitle>
          <CardDescription>
            Student participation and activity across your courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {courseEngagement.map((course) => (
              <div 
                key={course.course} 
                className="p-4 rounded-lg border border-border hover:bg-accent/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{course.course}</h3>
                  <div className={`w-3 h-3 rounded-full ${course.color}`}></div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {course.students} students
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Engagement</span>
                    <span>{course.engagement}%</span>
                  </div>
                  <Progress value={course.engagement} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="hover-lift shadow-soft animate-slide-up" style={{ animationDelay: "0.4s" }}>
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
          <ImprovedChatSystem userType="lecturer" />
        </CardContent>
      </Card>
    </div>
  );
}