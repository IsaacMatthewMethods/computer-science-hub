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
  course?: string; // Optional, as not all profiles might have a course
  role?: string; // Optional
  status?: "online" | "offline" | "away"; // Optional, for future presence features
  lastSeen?: string; // Optional
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
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
import { getConversationId } from "@/lib/utils"; // Import the utility function
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
  course?: string; // Optional, as not all profiles might have a course
  role?: string; // Optional
  status?: "online" | "offline" | "away"; // Optional, for future presence features
  lastSeen?: string; // Optional
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
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
  const [allUsers, setAllUsers] = useState<ChatContact[]>([]); // State to hold all users for new chat
  const [showNewChat, setShowNewChat] = useState(false); // State to toggle between conversations and new chat

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchAllUsers();
      setupRealtimeSubscription();
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

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, course, avatar_url")
        .neq("id", user?.id); // Exclude current user from contacts list

      if (error) {
        console.error("Error fetching profiles:", error);
        toast({
          title: "Error",
          description: "Failed to load contacts.",
          variant: "destructive",
        });
        return;
      }

      const contacts: ChatContact[] = profiles.map((profile) => ({
        id: profile.id,
        name: profile.full_name || "Unknown User",
        course: profile.course || "N/A", // Assuming 'course' might be in profiles
        role: profile.role || "User", // Assuming 'role' might be in profiles
        status: "offline", // Placeholder for now
        lastSeen: "", // Placeholder for now
        avatar: profile.avatar_url || "/api/placeholder/40/40",
        lastMessage: "No messages yet", // Placeholder for now
        lastMessageTime: "", // Placeholder for now
        unreadCount: 0, // Placeholder for now
        isGroup: false, // Assuming 1-on-1 chats for now
      }));
      setConversations(contacts);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = React.useCallback(async (contactId: string) => {
    try {
      if (!user?.id) return;
      const conversationId = getConversationId(user.id, contactId);
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:profiles(full_name)") // Fetch sender's full_name
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      const formattedMessages: ChatMessage[] = data.map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender?.full_name || "Unknown User", // Use fetched sender name
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
  }, [user]);

  const setupRealtimeSubscription = React.useCallback(() => {
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
          if (selectedChat && user) { // Ensure user is not null
            const expectedConversationId = getConversationId(user.id, selectedChat.id);
            if (payload.new.conversation_id === expectedConversationId) {
              const senderProfile = allUsers.find(u => u.id === payload.new.sender_id);
              const newMessage: ChatMessage = {
                id: payload.new.id,
                senderId: payload.new.sender_id,
                senderName: senderProfile?.name || "Unknown User",
                content: payload.new.content,
                timestamp: new Date(payload.new.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                status: "sent",
              };
              setMessages(prev => [...prev, newMessage]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat, user, allUsers]);

  const fetchAllUsers = React.useCallback(async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, course, avatar_url")
        .neq("id", user?.id); // Exclude current user

      if (error) {
        console.error("Error fetching all users:", error);
        return;
      }

      const users: ChatContact[] = profiles.map((profile) => ({
        id: profile.id,
        name: profile.full_name || "Unknown User",
        course: profile.course || "N/A",
        role: profile.role || "User",
        status: "offline",
        avatar: profile.avatar_url || "/api/placeholder/40/40",
        isGroup: false,
      }));
      setAllUsers(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  }, [user]);

  const handleSelectNewChat = (contact: ChatContact) => {
    setSelectedChat(contact);
    setShowNewChat(false);
    setSearchTerm(""); // Clear search term
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat || !user) return;

    try {
      const conversationId = getConversationId(user.id, selectedChat.id);
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
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

  const filteredUsers = allUsers.filter((userContact) =>
    userContact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContacts = conversations.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <Button onClick={() => setShowNewChat(true)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Contacts Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>{showNewChat ? "Start New Chat" : "Conversations"}</CardTitle>
              {showNewChat && (
                <Button variant="ghost" size="icon" onClick={() => setShowNewChat(false)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={showNewChat ? "Search users..." : "Search conversations..."}
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
              ) : showNewChat ? (
                <div className="space-y-1 p-4">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No users found.</p>
                  ) : (
                    filteredUsers.map((userContact) => (
                      <div
                        key={userContact.id}
                        onClick={() => handleSelectNewChat(userContact)}
                        className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={userContact.avatar} />
                          <AvatarFallback>{userContact.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{userContact.name}</p>
                          {userContact.course && (
                            <Badge variant="outline" className="text-xs">
                              {userContact.course}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-1 p-4">
                  {filteredContacts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No conversations found.</p>
                  ) : (
                    filteredContacts.map((contact) => (
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
                              {contact.unreadCount && contact.unreadCount > 0 && (
                                <Badge variant="destructive" className="h-5 w-5 text-xs p-0 flex items-center justify-center">
                                  {contact.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.lastMessage || "No messages yet"}
                          </p>
                          <div className="flex items-center justify-between">
                            {contact.course && (
                              <Badge variant="outline" className="text-xs">
                                {contact.course}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {contact.lastMessageTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
                        {selectedChat.status && (
                          <div className={`w-2 h-2 rounded-full ${
                            selectedChat.status === "online" ? "bg-green-500" : "bg-gray-400"
                          }`}></div>
                        )}
                        <span>{selectedChat.status || "Offline"}</span>
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