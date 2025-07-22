import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import {
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  Users,
  Search,
  Settings,
  PlusCircle,
  MessageCircle,
  BookOpen,
  Clock,
  Mic,
  MoreVertical,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: "text" | "file" | "image";
  isOwn: boolean;
  avatar?: string;
}

interface ChatContact {
  id: string;
  name: string;
  role: "student" | "lecturer" | "admin";
  avatar?: string;
  status: "online" | "offline" | "away";
  lastMessage?: string;
  lastActive: string;
  course?: string;
}

interface ChatSystemProps {
  userType: "student" | "lecturer";
  userName: string;
}

export function ChatSystem({ userType, userName }: ChatSystemProps) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const messages: ChatMessage[] = [
    {
      id: "1",
      sender: "Dr. Smith",
      content: "Good afternoon! I've uploaded the new assignment for next week. Please check the Resources section.",
      timestamp: "2:30 PM",
      type: "text",
      isOwn: false,
      avatar: "/placeholder-avatar.jpg",
    },
    {
      id: "2",
      sender: userName,
      content: "Thank you, Professor! I'll review it today. Do you have any specific requirements for the documentation?",
      timestamp: "2:32 PM",
      type: "text",
      isOwn: true,
    },
    {
      id: "3",
      sender: "Dr. Smith",
      content: "Yes, please follow the IEEE format for citations and make sure to include unit tests for your code.",
      timestamp: "2:35 PM",
      type: "text",
      isOwn: false,
      avatar: "/placeholder-avatar.jpg",
    },
    {
      id: "4",
      sender: userName,
      content: "Perfect! I'll make sure to include comprehensive tests. Looking forward to working on this project.",
      timestamp: "2:37 PM",
      type: "text",
      isOwn: true,
    },
  ];

  const contacts: ChatContact[] = [
    {
      id: "contact1",
      name: "Dr. Sarah Smith",
      role: "lecturer",
      status: "online",
      lastMessage: "Yes, please follow the IEEE format...",
      lastActive: "2 min ago",
      course: "CS401",
    },
    {
      id: "contact2",
      name: "Alex Johnson",
      role: "student",
      status: "online",
      lastMessage: "Are you available for the group project meeting?",
      lastActive: "5 min ago",
      course: "CS301",
    },
    {
      id: "contact3",
      name: "Prof. Michael Chen",
      role: "lecturer",
      status: "away",
      lastMessage: "I'll send the lecture slides tonight",
      lastActive: "1 hour ago",
      course: "CS502",
    },
    {
      id: "contact4",
      name: "Emma Davis",
      role: "student",
      status: "offline",
      lastMessage: "Thanks for the study group notes!",
      lastActive: "3 hours ago",
      course: "CS301",
    },
    {
      id: "contact5",
      name: "Study Group - CS401",
      role: "student",
      status: "online",
      lastMessage: "Meeting at 3 PM in the library",
      lastActive: "10 min ago",
      course: "CS401",
    },
  ];

  const courseGroups = [
    {
      id: "group1",
      name: "CS301 - Data Structures",
      members: 45,
      lastActivity: "2 min ago",
      unread: 3,
    },
    {
      id: "group2",
      name: "CS401 - Database Systems",
      members: 38,
      lastActivity: "15 min ago",
      unread: 0,
    },
    {
      id: "group3",
      name: "CS502 - Machine Learning",
      members: 29,
      lastActivity: "1 hour ago",
      unread: 1,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success";
      case "away":
        return "bg-warning";
      default:
        return "bg-muted-foreground";
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-lg overflow-hidden shadow-medium animate-fade-in">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Chat Tabs */}
        <Tabs defaultValue="direct" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
            <TabsTrigger value="direct">Direct</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2">
                {contacts
                  .filter(contact => 
                    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                        selectedChat === contact.id ? "bg-accent" : ""
                      } animate-slide-up`}
                      onClick={() => setSelectedChat(contact.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                              {contact.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(contact.status)} border-2 border-card rounded-full`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {contact.name}
                            </p>
                            <div className="flex items-center space-x-1">
                              <Badge 
                                variant={contact.role === "lecturer" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {contact.role}
                              </Badge>
                              {contact.course && (
                                <Badge variant="outline" className="text-xs">
                                  {contact.course}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.lastMessage}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contact.lastActive}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="groups" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2">
                <div className="mb-4">
                  <Button className="w-full bg-gradient-primary hover-glow" size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </div>
                {courseGroups.map((group) => (
                  <div
                    key={group.id}
                    className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 mb-2 animate-slide-up"
                    onClick={() => setSelectedChat(group.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-primary/10 rounded-md">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.members} members
                          </p>
                        </div>
                      </div>
                      {group.unread > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground">
                          {group.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last activity: {group.lastActivity}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      DS
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">Dr. Sarah Smith</h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span>Online</span>
                      <span>•</span>
                      <span>CS401</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="hover-lift">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover-lift">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover-lift">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} animate-fade-in`}
                  >
                    <div className={`flex space-x-2 max-w-xs lg:max-w-md ${msg.isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
                      {!msg.isOwn && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.avatar} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                            {msg.sender.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`rounded-lg p-3 ${
                        msg.isOwn 
                          ? "bg-gradient-primary text-primary-foreground" 
                          : "bg-card border border-border"
                      }`}>
                        {!msg.isOwn && (
                          <p className="text-xs font-medium mb-1 text-muted-foreground">
                            {msg.sender}
                          </p>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.isOwn 
                            ? "text-primary-foreground/70" 
                            : "text-muted-foreground"
                        }`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="hover-lift">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="border-0 bg-background focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button variant="ghost" size="icon" className="hover-lift">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover-lift">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  className="bg-gradient-primary hover-glow"
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center animate-scale-in">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <MessageCircle className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose from your existing conversations or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}