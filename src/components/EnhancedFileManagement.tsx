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
import { Switch } from "@/components/ui/switch";
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
  pageContext?: "resources" | "my-files";
}

export const EnhancedFileManagement = ({ userType, pageContext }: EnhancedFileManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [files, setFiles] = useState<DatabaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState(
    pageContext === "resources" ? "shared" : 
    pageContext === "my-files" ? "my-files" : 
    "all"
  );
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: "",
    description: "",
    is_public: false,
  });

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

  const handleFileUpload = async () => {
    if (!uploadForm.file || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Insert file record into database
      const { data, error } = await supabase
        .from("files")
        .insert({
          filename: uploadForm.file.name,
          file_type: uploadForm.file.type,
          file_size: uploadForm.file.size,
          file_path: `/uploads/${uploadForm.file.name}`,
          uploaded_by: user.id,
          title: uploadForm.title || uploadForm.file.name,
          description: uploadForm.description,
          is_public: uploadForm.is_public,
        })
        .select()
        .single();

      if (error) throw error;

      setUploadProgress(100);
      
      toast({
        title: "File uploaded successfully",
        description: `${uploadForm.file.name} has been uploaded.`,
      });

      // Reset form and close dialog
      setUploadForm({
        file: null,
        title: "",
        description: "",
        is_public: false,
      });
      setShowUploadDialog(false);
      
      // Refresh files list
      fetchFiles();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">
          {pageContext === "resources" ? "Resources" : 
           pageContext === "my-files" ? "My Files" : 
           "Enhanced File Management"}
        </h1>
        <Button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
      </div>
      
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
        <TabsList className={`grid w-full ${pageContext ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {!pageContext && <TabsTrigger value="all">All Files</TabsTrigger>}
          {pageContext !== "resources" && <TabsTrigger value="my-files">My Files</TabsTrigger>}
          {pageContext !== "my-files" && <TabsTrigger value="shared">Resources</TabsTrigger>}
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

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Choose a file to upload and set its visibility preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setUploadForm(prev => ({ ...prev, file }));
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a custom title for the file"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter a description for the file"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={uploadForm.is_public}
                onCheckedChange={(checked) => setUploadForm(prev => ({ ...prev, is_public: checked }))}
              />
              <Label htmlFor="public" className="flex items-center gap-2">
                {uploadForm.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {uploadForm.is_public ? "Public - visible to other students" : "Private - only visible to you"}
              </Label>
            </div>
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={!uploadForm.file || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};