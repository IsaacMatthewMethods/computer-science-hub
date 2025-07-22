import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

interface StudentDashboardProps {
  studentName: string;
}

export function StudentDashboard({ studentName }: StudentDashboardProps) {
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgressValue(75), 500);
    return () => clearTimeout(timer);
  }, []);

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
      value: "42",
      icon: Download,
      trend: "+12%",
      color: "text-blue-500",
    },
    {
      label: "Assignments Completed",
      value: "18",
      icon: FileText,
      trend: "+8%",
      color: "text-green-500",
    },
    {
      label: "Chat Messages",
      value: "156",
      icon: MessageSquare,
      trend: "+25%",
      color: "text-purple-500",
    },
    {
      label: "Collaboration Hours",
      value: "24",
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
              Welcome back, {studentName}! 👋
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
            <Star className="h-5 w-5 mr-2 text-warning" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col bg-gradient-primary hover-glow">
              <BookOpen className="h-6 w-6 mb-2" />
              Browse Resources
            </Button>
            <Button variant="outline" className="h-20 flex-col hover-lift">
              <MessageSquare className="h-6 w-6 mb-2" />
              Start Chat
            </Button>
            <Button variant="outline" className="h-20 flex-col hover-lift">
              <Users className="h-6 w-6 mb-2" />
              Join Collaboration
            </Button>
            <Button variant="outline" className="h-20 flex-col hover-lift">
              <FileText className="h-6 w-6 mb-2" />
              Submit Assignment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}