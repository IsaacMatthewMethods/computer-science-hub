import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Search,
  Download,
  Trash2,
  File,
  FileText,
  Image,
  Video,
  Music,
  Eye,
  EyeOff,
  Globe,
  Lock,
} from "lucide-react";

interface DatabaseFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_path: string;
  uploaded_by: string;
  download_count: number;
  created_at: string;
  title?: string;
  description?: string;
  is_public?: boolean;
}

interface EnhancedFileManagementProps {
  userType: "student" | "lecturer";
}

export const EnhancedFileManagement = ({ userType }: EnhancedFileManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [files, setFiles] = useState<DatabaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      toast({
        title: "Error loading files",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredFiles = () => {
    let filteredFiles = files.filter(file =>
      file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.title && file.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    switch (selectedTab) {
      case "my-files":
        return filteredFiles.filter(file => file.uploaded_by === user?.id);
      case "shared":
        return filteredFiles.filter(file => file.is_public && file.uploaded_by !== user?.id);
      case "recent":
        return filteredFiles.slice(0, 20);
      default:
        return filteredFiles;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Enhanced File Management</h1>
      
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search files..." 
          className="pl-8" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="my-files">My Files</TabsTrigger>
          <TabsTrigger value="shared">Resources</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          <Card>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredFiles().map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <p className="font-medium">{file.title || file.filename}</p>
                        <p className="text-sm text-muted-foreground">{file.filename}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={file.is_public ? "default" : "secondary"}>
                          {file.is_public ? "Public" : "Private"}
                        </Badge>
                        <span className="text-sm">{file.download_count} downloads</span>
                      </div>
                    </div>
                  ))}
                  {getFilteredFiles().length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">No files found</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};