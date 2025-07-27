import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Search, Send, Users, MessageCircle, Plus } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
}

interface ChatContact {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  last_message?: string;
  last_message_at?: string;
  conversation_id?: string;
}

interface ImprovedChatSystemProps {
  userType: "student" | "lecturer" | "counselor";
}

export const ImprovedChatSystem = ({ userType }: ImprovedChatSystemProps) => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<ChatContact | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<ChatContact[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await Promise.all([fetchAllUsers(), fetchConversations()]);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load chat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchAllUsers = async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role")
      .neq("id", user?.id);

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    setAllUsers(profiles?.map(profile => ({
      ...profile,
      full_name: profile.full_name || profile.email || "Unknown User"
    })) || []);
  };

  const fetchConversations = async () => {
    const { data: conversationData, error } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        conversations:conversation_id (
          id,
          last_message_at
        )
      `)
      .eq("user_id", user?.id);

    if (error) {
      console.error("Error fetching conversations:", error);
      return;
    }

    if (!conversationData?.length) {
      setConversations([]);
      return;
    }

    // Get other participants for each conversation
    const conversationIds = conversationData.map(c => c.conversation_id);
    const { data: participantsData, error: participantsError } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        user_id,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      `)
      .in("conversation_id", conversationIds)
      .neq("user_id", user?.id);

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      return;
    }

    // Get latest messages for conversations
    const { data: messagesData } = await supabase
      .from("messages")
      .select("conversation_id, content, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    const conversationsWithParticipants = conversationData.map(conv => {
      const participant = participantsData?.find(p => p.conversation_id === conv.conversation_id);
      const profile = participant?.profiles;
      const lastMessage = messagesData?.find(m => m.conversation_id === conv.conversation_id);

      return {
        id: profile?.id || "",
        full_name: profile?.full_name || profile?.email || "Unknown User",
        email: profile?.email || "",
        avatar_url: profile?.avatar_url,
        role: profile?.role || "student",
        last_message: lastMessage?.content,
        last_message_at: lastMessage?.created_at || conv.conversations?.last_message_at,
        conversation_id: conv.conversation_id.toString(),
      };
    }).filter(c => c.id);

    setConversations(conversationsWithParticipants);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data: messagesData, error } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        sender_id,
        conversation_id,
        created_at,
        profiles:sender_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
      return;
    }

    const formattedMessages = messagesData?.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender_id: msg.sender_id,
      conversation_id: msg.conversation_id,
      created_at: msg.created_at,
      sender: {
        id: msg.profiles?.id || msg.sender_id,
        full_name: msg.profiles?.full_name || msg.profiles?.email || "Unknown User",
        avatar_url: msg.profiles?.avatar_url,
        email: msg.profiles?.email || "",
      },
    })) || [];

    setMessages(formattedMessages);
    setTimeout(scrollToBottom, 100);
  };

  const setupRealtimeSubscriptions = useCallback(() => {
    const channel = supabase
      .channel("chat-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("New message received:", payload);
          if (selectedChat?.conversation_id) {
            fetchMessages(selectedChat.conversation_id);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat?.conversation_id]);

  const handleStartChat = async (contact: ChatContact) => {
    try {
      const { data, error } = await supabase.rpc("create_conversation", {
        participant_id: contact.id,
      });

      if (error) throw error;

      const conversationId = data.toString();
      const chatContact = {
        ...contact,
        conversation_id: conversationId,
      };

      setSelectedChat(chatContact);
      setShowNewChat(false);
      await fetchMessages(conversationId);
      await fetchConversations();

      toast({
        title: "Chat Started",
        description: `Started conversation with ${contact.full_name}`,
      });
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat?.conversation_id) return;

    try {
      const { error } = await supabase.rpc("send_message", {
        p_conversation_uuid: selectedChat.conversation_id,
        p_content: messageInput.trim(),
      });

      if (error) throw error;

      setMessageInput("");
      await fetchMessages(selectedChat.conversation_id);
      await fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleSelectChat = async (contact: ChatContact) => {
    if (!contact.conversation_id) {
      await handleStartChat(contact);
      return;
    }

    setSelectedChat(contact);
    await fetchMessages(contact.conversation_id);
  };

  const filteredUsers = showNewChat
    ? allUsers.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations.filter(conv =>
        conv.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    if (user) {
      const cleanup = setupRealtimeSubscriptions();
      return cleanup;
    }
  }, [user, setupRealtimeSubscriptions]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Please log in to access chat</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-background">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {showNewChat ? "Find People" : "Recent Chats"}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewChat(!showNewChat)}
              className="flex items-center gap-1"
            >
              {showNewChat ? <MessageCircle className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {showNewChat ? "Chats" : "New"}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={showNewChat ? "Search people..." : "Search chats..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {showNewChat ? "No users found" : "No conversations yet"}
              </p>
            ) : (
              filteredUsers.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleSelectChat(contact)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                    selectedChat?.id === contact.id ? "bg-accent" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={contact.avatar_url || ""} />
                    <AvatarFallback>
                      {contact.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{contact.full_name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {contact.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.last_message || contact.email}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedChat.avatar_url || ""} />
                  <AvatarFallback>
                    {selectedChat.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedChat.full_name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {selectedChat.role}
                  </p>
                </div>
              </div>
            </CardHeader>

            <Separator />

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_id === user.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Welcome to Chat</h3>
              <p className="text-muted-foreground">
                Select a conversation or start a new chat to begin messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};