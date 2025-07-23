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
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Users,
  MessageSquare,
  ArrowLeft,
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
  course: string;
  role: string;
  status: "online" | "offline" | "away";
  lastSeen: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isGroup: boolean;
}

interface ChatSystemProps {
  userType: "student" | "lecturer";
  userName: string;
}

export const ChatSystem = ({ userType, userName }: ChatSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedChat, setSelectedChat] = useState<ChatContact | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      // This is a simplified version - in reality you'd join with profiles to get user details
      const contacts: ChatContact[] = [
        {
          id: "1",
          name: "Dr. Sarah Wilson",
          course: "Computer Science",
          role: "Lecturer",
          status: "online",
          lastSeen: "now",
          avatar: "/api/placeholder/40/40",
          lastMessage: "Great work on your assignment!",
          lastMessageTime: "2 min ago",
          unreadCount: 0,
          isGroup: false,
        },
        {
          id: "2",
          name: "Study Group - AI Ethics",
          course: "Philosophy",
          role: "Student",
          status: "online",
          lastSeen: "now",
          avatar: "/api/placeholder/40/40",
          lastMessage: "Meeting tomorrow at 3 PM",
          lastMessageTime: "5 min ago",
          unreadCount: 3,
          isGroup: true,
        },
      ];
      setConversations(contacts);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      const formattedMessages: ChatMessage[] = data.map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender_id === user?.id ? userName : "Other User",
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: msg.is_read ? "read" : "sent",
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage: ChatMessage = {
            id: payload.new.id,
            senderId: payload.new.sender_id,
            senderName: payload.new.sender_id === user?.id ? userName : "Other User",
            content: payload.new.content,
            timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            status: "sent",
          };
          
          if (selectedChat && payload.new.conversation_id === selectedChat.id) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat || !user) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedChat.id,
          sender_id: user.id,
          content: messageInput.trim(),
        });

      if (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Message failed",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Message failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredContacts = conversations.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <Button>
          <MessageSquare className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Contacts Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
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
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-1 p-4">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedChat(contact)}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                        selectedChat?.id === contact.id ? "bg-accent" : ""
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{contact.name}</p>
                          <div className="flex items-center space-x-1">
                            {contact.status === "online" && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                            {contact.unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 w-5 text-xs p-0 flex items-center justify-center">
                                {contact.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.lastMessage}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {contact.course}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {contact.lastMessageTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                        <div className={`w-2 h-2 rounded-full ${
                          selectedChat.status === "online" ? "bg-green-500" : "bg-gray-400"
                        }`}></div>
                        <span>{selectedChat.status}</span>
                        <span>•</span>
                        <span>{selectedChat.course}</span>
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
                    onKeyPress={handleKeyPress}
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
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose from your existing conversations or start a new one
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};