import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Users,
  MessageSquare,
  ArrowLeft,
  Circle,
  Loader2,
} from "lucide-react";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

interface ChatContact {
  id: string;
  name: string;
  course?: string;
  role?: string;
  status?: "online" | "offline" | "away" | "busy";
  lastSeen?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isGroup: boolean;
}

interface SimplifiedChatSystemProps {
  userType: "student" | "lecturer";
  userName: string;
  user: User | null;
}

export const SimplifiedChatSystem = ({ userType, userName, user }: SimplifiedChatSystemProps) => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedChat, setSelectedChat] = useState<ChatContact | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<ChatContact[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAllUsers(),
        fetchConversations()
      ]);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role, course, avatar_url")
        .neq("id", user?.id);

      if (error) throw error;

      const users: ChatContact[] = profiles.map((profile: any) => ({
        id: profile.id,
        name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown User",
        course: profile.course || "N/A",
        role: profile.role || "User",
        status: "offline", // Simplified status
        avatar: profile.avatar_url || "/api/placeholder/40/40",
        isGroup: false,
      }));
      
      setAllUsers(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  const fetchConversations = async () => {
    try {
      // For simplicity, show recent profiles as potential conversations
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role, course, avatar_url")
        .neq("id", user?.id)
        .limit(10);

      if (error) throw error;

      const conversationList: ChatContact[] = profiles.map((profile: any) => ({
        id: profile.id,
        name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown User",
        course: profile.course || "N/A",
        role: profile.role || "User",
        status: "offline",
        avatar: profile.avatar_url || "/api/placeholder/40/40",
        lastMessage: "Start a conversation",
        lastMessageTime: "",
        unreadCount: 0,
        isGroup: false,
      }));
      
      setConversations(conversationList);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      if (!user?.id) return;
      
      // Try to fetch from existing conversation, fallback to empty
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      const formattedMessages: ChatMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender_id === user?.id ? "You" : "Other User",
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: "read",
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]); // Start with empty conversation
    }
  };

  const setupRealtimeSubscriptions = () => {
    const messagesChannel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        if (selectedChat && payload.new.conversation_id === selectedChat.id) {
          const newMessage: ChatMessage = {
            id: payload.new.id,
            senderId: payload.new.sender_id,
            senderName: payload.new.sender_id === user?.id ? "You" : "Other User",
            content: payload.new.content,
            timestamp: new Date(payload.new.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
            status: "sent",
          };
          setMessages(prev => [...prev, newMessage]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  };

  const handleStartChat = async (contact: ChatContact) => {
    try {
      const { data: conversationId, error } = await supabase.rpc('create_conversation', { 
        participant_id: contact.id 
      });
      if (error) throw error;
      setSelectedChat({ ...contact, id: conversationId.toString() });
      setShowNewChat(false);
      setSearchTerm("");
    } catch (error) {
      console.error("Error creating conversation:", error);
      // For demo purposes, allow chat without actual conversation
      setSelectedChat({ ...contact, id: `demo-${contact.id}` });
      setShowNewChat(false);
      setSearchTerm("");
      toast({
        title: "Demo Mode",
        description: "Starting demo conversation (messages won't persist).",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat || !user) return;

    try {
      // Try to send via database, fallback to local demo
      if (selectedChat.id.startsWith('demo-')) {
        // Local demo message
        const demoMessage: ChatMessage = {
          id: Date.now().toString(),
          senderId: user.id,
          senderName: "You",
          content: messageInput.trim(),
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: "sent",
        };
        setMessages(prev => [...prev, demoMessage]);
        setMessageInput("");
        return;
      }

      await supabase.rpc('send_message', {
        p_conversation_uuid: selectedChat.id,
        p_content: messageInput.trim()
      });
      setMessageInput("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Fallback to demo mode
      const demoMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: user.id,
        senderName: "You",
        content: messageInput.trim(),
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: "sent",
      };
      setMessages(prev => [...prev, demoMessage]);
      setMessageInput("");
      toast({
        title: "Demo Mode",
        description: "Message sent in demo mode (won't persist).",
      });
    }
  };

  const renderUserList = (users: ChatContact[]) => (
    <div className="space-y-1 p-4">
      {users.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No users found.</p>
      ) : (
        users.map((userContact) => (
          <div
            key={userContact.id}
            className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent"
            onClick={() => handleStartChat(userContact)}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userContact.avatar} />
                  <AvatarFallback>{userContact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Circle className="absolute -bottom-1 -right-1 h-3 w-3 border-2 border-background fill-current text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userContact.name}</p>
                {userContact.course && (
                  <Badge variant="outline" className="text-xs">
                    {userContact.course}
                  </Badge>
                )}
              </div>
            </div>
            <Button size="sm" variant="ghost">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}
    </div>
  );

  const filteredUsers = allUsers.filter((userContact) =>
    userContact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = conversations.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Chat System</h1>
        <div className="flex space-x-2">
          <Button onClick={() => setShowNewChat(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Contacts Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>
                {showNewChat ? "Find People" : "Recent Chats"}
              </CardTitle>
              {showNewChat && (
                <Button variant="ghost" size="icon" onClick={() => setShowNewChat(false)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={showNewChat ? "Search people..." : "Search chats..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : showNewChat ? (
                <div>
                  <h3 className="px-4 py-2 text-sm font-semibold text-muted-foreground">All People</h3>
                  {renderUserList(filteredUsers)}
                </div>
              ) : (
                renderUserList(filteredConversations)
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedChat.avatar} />
                      <AvatarFallback>{selectedChat.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedChat.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Circle className="h-2 w-2 fill-current text-gray-400" />
                        <span>Offline</span>
                        {selectedChat.course && (
                          <>
                            <span>•</span>
                            <span>{selectedChat.course}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              {/* Messages */}
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                      <p>Start your conversation with {selectedChat.name}</p>
                    </div>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === user?.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.senderId === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <Separator />

              {/* Message Input */}
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            /* No Chat Selected */
            <CardContent className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Enhanced Chat Features</h3>
                <div className="text-muted-foreground space-y-1">
                  <p>🔹 Real-time messaging</p>
                  <p>🔹 Search and find people</p>
                  <p>🔹 Start conversations instantly</p>
                  <p>🔹 Clean and intuitive interface</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};