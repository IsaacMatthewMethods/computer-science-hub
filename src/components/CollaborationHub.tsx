import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Plus,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Target,
  TrendingUp,
  Star,
  Share,
  Settings,
  MoreVertical,
  GitBranch,
  Code,
  VideoIcon,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  status: "active" | "pending" | "completed";
  priority: "high" | "medium" | "low";
  progress: number;
  members: ProjectMember[];
  deadline: string;
  course: string;
  tags: string[];
  tasks: Task[];
  lastActivity: string;
}

interface ProjectMember {
  id: string;
  name: string;
  role: "leader" | "member" | "contributor";
  avatar?: string;
  status: "online" | "offline" | "away";
}

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: "todo" | "in-progress" | "review" | "completed";
  priority: "high" | "medium" | "low";
  dueDate: string;
}

interface StudyGroup {
  id: string;
  name: string;
  course: string;
  members: number;
  description: string;
  nextMeeting: string;
  isPublic: boolean;
  tags: string[];
}

interface CollaborationHubProps {
  userType: "student" | "lecturer";
}

export function CollaborationHub({ userType }: CollaborationHubProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const projects: Project[] = [
    {
      id: "proj1",
      title: "E-Commerce Platform",
      description: "Building a full-stack e-commerce application using React and Node.js",
      status: "active",
      priority: "high",
      progress: 68,
      deadline: "2024-02-15",
      course: "CS401",
      tags: ["React", "Node.js", "Database"],
      lastActivity: "2 hours ago",
      members: [
        { id: "m1", name: "Alex Johnson", role: "leader", status: "online" },
        { id: "m2", name: "Sarah Wilson", role: "member", status: "away" },
        { id: "m3", name: "Mike Davis", role: "member", status: "offline" },
      ],
      tasks: [
        { id: "t1", title: "API Integration", assignee: "Alex", status: "in-progress", priority: "high", dueDate: "Tomorrow" },
        { id: "t2", title: "UI Components", assignee: "Sarah", status: "review", priority: "medium", dueDate: "Today" },
        { id: "t3", title: "Database Schema", assignee: "Mike", status: "completed", priority: "high", dueDate: "Yesterday" },
      ],
    },
    {
      id: "proj2",
      title: "Machine Learning Model",
      description: "Developing a neural network for image classification",
      status: "active",
      priority: "medium",
      progress: 45,
      deadline: "2024-02-28",
      course: "CS502",
      tags: ["Python", "TensorFlow", "AI"],
      lastActivity: "1 day ago",
      members: [
        { id: "m4", name: "Emma Brown", role: "leader", status: "online" },
        { id: "m5", name: "John Smith", role: "member", status: "online" },
      ],
      tasks: [
        { id: "t4", title: "Data Preprocessing", assignee: "Emma", status: "completed", priority: "high", dueDate: "Last week" },
        { id: "t5", title: "Model Training", assignee: "John", status: "in-progress", priority: "high", dueDate: "This week" },
      ],
    },
    {
      id: "proj3",
      title: "Database Management System",
      description: "Creating a custom DBMS with advanced query optimization",
      status: "pending",
      priority: "low",
      progress: 15,
      deadline: "2024-03-15",
      course: "CS301",
      tags: ["SQL", "Optimization", "Systems"],
      lastActivity: "3 days ago",
      members: [
        { id: "m6", name: "Lisa Chen", role: "leader", status: "away" },
        { id: "m7", name: "Tom Wilson", role: "member", status: "offline" },
      ],
      tasks: [
        { id: "t6", title: "Architecture Design", assignee: "Lisa", status: "todo", priority: "high", dueDate: "Next week" },
      ],
    },
  ];

  const studyGroups: StudyGroup[] = [
    {
      id: "sg1",
      name: "Data Structures Study Group",
      course: "CS301",
      members: 8,
      description: "Weekly meetings to discuss algorithms and data structures",
      nextMeeting: "Today 3:00 PM",
      isPublic: true,
      tags: ["Algorithms", "Problem Solving"],
    },
    {
      id: "sg2",
      name: "ML Research Group",
      course: "CS502",
      members: 12,
      description: "Exploring cutting-edge machine learning research papers",
      nextMeeting: "Tomorrow 2:00 PM",
      isPublic: true,
      tags: ["Research", "Deep Learning"],
    },
    {
      id: "sg3",
      name: "Web Development Circle",
      course: "CS401",
      members: 15,
      description: "Building projects and sharing web development knowledge",
      nextMeeting: "Friday 4:00 PM",
      isPublic: false,
      tags: ["Frontend", "Backend", "Projects"],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "online":
      case "completed":
        return "text-success";
      case "pending":
      case "away":
      case "in-progress":
        return "text-warning";
      case "offline":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive";
      case "medium":
        return "bg-warning";
      case "low":
        return "bg-success";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collaboration Hub</h1>
          <p className="text-muted-foreground">
            Work together on projects and join study groups
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="bg-gradient-primary hover-glow">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          <Button variant="outline" className="hover-lift">
            <Users className="h-4 w-4 mr-2" />
            Join Group
          </Button>
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="groups">Study Groups</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* Project Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <Card 
                key={project.id} 
                className={`hover-lift shadow-soft cursor-pointer animate-scale-in ${
                  selectedProject === project.id ? "ring-2 ring-primary" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedProject(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{project.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {project.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={project.status === "active" ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    {/* Members */}
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-2">
                        {project.members.slice(0, 3).map((member) => (
                          <Avatar key={member.id} className="h-6 w-6 border-2 border-card">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {project.members.length} members
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due {project.deadline}</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)}`}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Project Details */}
          {selectedProject && (
            <Card className="shadow-medium animate-slide-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span>Project Details</span>
                    </CardTitle>
                    <CardDescription>
                      Manage tasks and collaborate with your team
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="hover-lift">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" className="hover-lift">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const project = projects.find(p => p.id === selectedProject);
                  if (!project) return null;

                  return (
                    <div className="space-y-6">
                      {/* Project Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-accent/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">{project.tasks.length}</div>
                          <div className="text-sm text-muted-foreground">Total Tasks</div>
                        </div>
                        <div className="text-center p-4 bg-accent/30 rounded-lg">
                          <div className="text-2xl font-bold text-success">
                            {project.tasks.filter(t => t.status === "completed").length}
                          </div>
                          <div className="text-sm text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center p-4 bg-accent/30 rounded-lg">
                          <div className="text-2xl font-bold text-warning">
                            {project.tasks.filter(t => t.status === "in-progress").length}
                          </div>
                          <div className="text-sm text-muted-foreground">In Progress</div>
                        </div>
                        <div className="text-center p-4 bg-accent/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">{project.members.length}</div>
                          <div className="text-sm text-muted-foreground">Team Members</div>
                        </div>
                      </div>

                      {/* Tasks */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
                          Tasks
                        </h3>
                        <div className="space-y-3">
                          {project.tasks.map((task) => (
                            <div 
                              key={task.id} 
                              className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/30 transition-all duration-200"
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  task.status === "completed" ? "bg-success" :
                                  task.status === "in-progress" ? "bg-warning" : 
                                  task.status === "review" ? "bg-primary" : "bg-muted"
                                }`}></div>
                                <div>
                                  <p className="font-medium">{task.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Assigned to {task.assignee} • Due {task.dueDate}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={task.priority === "high" ? "destructive" : "secondary"}
                                  className="text-xs"
                                >
                                  {task.priority}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team Members */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Users className="h-5 w-5 mr-2 text-primary" />
                          Team Members
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {project.members.map((member) => (
                            <div 
                              key={member.id} 
                              className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg hover:bg-accent/30 transition-all duration-200"
                            >
                              <div className="relative">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                    {member.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${
                                  member.status === "online" ? "bg-success" :
                                  member.status === "away" ? "bg-warning" : "bg-muted-foreground"
                                } border-2 border-card rounded-full`}></div>
                              </div>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={member.role === "leader" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {member.role}
                                  </Badge>
                                  <span className={`text-xs capitalize ${getStatusColor(member.status)}`}>
                                    {member.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studyGroups.map((group, index) => (
              <Card 
                key={group.id} 
                className="hover-lift shadow-soft animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription>{group.course}</CardDescription>
                    </div>
                    <Badge variant={group.isPublic ? "default" : "secondary"}>
                      {group.isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {group.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{group.members} members</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {group.nextMeeting}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {group.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button className="flex-1 bg-gradient-primary hover-glow" size="sm">
                        Join Group
                      </Button>
                      <Button variant="outline" size="sm" className="hover-lift">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="hover-lift">
                        <VideoIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discover" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                  Trending Projects
                </CardTitle>
                <CardDescription>
                  Popular projects from other students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Blockchain Voting System", course: "CS501", members: 6, likes: 24 },
                  { title: "AR Mobile Game", course: "CS402", members: 4, likes: 18 },
                  { title: "IoT Home Automation", course: "CS503", members: 5, likes: 32 },
                ].map((project, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-accent/30 rounded-lg hover:bg-accent/50 transition-all duration-200"
                  >
                    <div>
                      <p className="font-medium">{project.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.course} • {project.members} members
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-warning" />
                        <span className="text-sm">{project.likes}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="h-5 w-5 mr-2 text-primary" />
                  Open Source Contributions
                </CardTitle>
                <CardDescription>
                  Contribute to student-led open source projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "University Course Planner", tech: "React", issues: 12, contributors: 8 },
                  { title: "Study Buddy Matcher", tech: "Flutter", issues: 8, contributors: 6 },
                  { title: "Grade Calculator API", tech: "Node.js", issues: 5, contributors: 4 },
                ].map((project, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-accent/30 rounded-lg hover:bg-accent/50 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.tech} • {project.issues} open issues
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {project.contributors} contributors
                      </Badge>
                      <Button variant="outline" size="sm">
                        Contribute
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}