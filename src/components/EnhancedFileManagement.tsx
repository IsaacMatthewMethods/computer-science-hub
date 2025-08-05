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
import { FileViewer } from "@/components/FileViewer";
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
  const [selectedFile, setSelectedFile] = useState<DatabaseFile | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);

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
      // Create unique file path
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, uploadForm.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Insert file record into database
      const { data, error } = await supabase
        .from("files")
        .insert({
          filename: uploadForm.file.name,
          file_type: uploadForm.file.type,
          file_size: uploadForm.file.size,
          file_path: uploadData.path,
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
      console.error('Upload error:', error);
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

  const getFileIcon = (filename: string, fileType?: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (fileType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (fileType === 'application/pdf' || extension === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    if (fileType?.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) {
      return <Video className="h-5 w-5 text-purple-500" />;
    }
    if (fileType?.startsWith('audio/') || ['mp3', 'wav', 'flac'].includes(extension || '')) {
      return <Music className="h-5 w-5 text-green-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const handleViewFile = (file: DatabaseFile) => {
    setSelectedFile(file);
    setShowFileViewer(true);
  };

  const handleDownload = async (file: DatabaseFile) => {
    try {
      const { data } = supabase.storage.from('files').getPublicUrl(file.file_path);
      
      const link = document.createElement('a');
      link.href = data.publicUrl;
      link.download = file.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update download count
      await supabase
        .from('files')
        .update({ download_count: (file.download_count || 0) + 1 })
        .eq('id', file.id);

      toast({
        title: "Download started",
        description: `Downloading ${file.filename}`,
      });

      // Refresh files to update download count
      fetchFiles();
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download file",
        variant: "destructive",
      });
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
                    <Card key={file.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(file.filename, file.file_type)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{file.title || file.filename}</p>
                              <p className="text-sm text-muted-foreground truncate">{file.filename}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant={file.is_public ? "default" : "secondary"} className="text-xs">
                                  {file.is_public ? (
                                    <>
                                      <Globe className="h-3 w-3 mr-1" />
                                      Public
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-3 w-3 mr-1" />
                                      Private
                                    </>
                                  )}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {file.download_count || 0} downloads
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewFile(file)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(file)}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                        {file.description && (
                          <p className="text-sm text-muted-foreground mt-2 truncate">
                            {file.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {getFilteredFiles().length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No files found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedTab === "my-files" ? "Upload some files to get started" : "No files match your search criteria"}
                        </p>
                      </CardContent>
                    </Card>
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

      <FileViewer
        file={selectedFile}
        isOpen={showFileViewer}
        onClose={() => {
          setShowFileViewer(false);
          setSelectedFile(null);
        }}
      />
    </div>
  );
};