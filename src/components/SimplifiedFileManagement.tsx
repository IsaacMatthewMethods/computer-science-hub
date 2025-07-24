import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import {
  Upload,
  Search,
  Filter,
  Download,
  Share2,
  Trash2,
  File,
  FileText,
  Image,
  Video,
  Music,
  MoreHorizontal,
  Eye,
  Globe,
  Lock,
  Clock,
  Users,
} from "lucide-react";

interface DatabaseFile {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  uploaded_by: string;
  download_count: number;
  created_at: string;
  updated_at: string;
}

interface SimplifiedFileManagementProps {
  userType: "student" | "lecturer";
}

export const SimplifiedFileManagement = ({ userType }: SimplifiedFileManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [files, setFiles] = useState<DatabaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [newFileIsPublic, setNewFileIsPublic] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      // Fetch files from database
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFiles(data || []);

      // Calculate storage used (only for user's own files)
      const userFiles = data?.filter(file => file.uploaded_by === user?.id) || [];
      const totalSize = userFiles.reduce((sum, file) => sum + file.file_size, 0);
      setStorageUsed(Math.min(100, Math.round((totalSize / (500 * 1024 * 1024)) * 100)));

    } catch (error) {
      console.error("Error fetching files:", error);
      toast({
        title: "Error loading files",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFileToSupabase = async (file: File): Promise<DatabaseFile> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    const { data, error } = await supabase
      .from("files")
      .insert({
        file_name: file.name,
        file_type: getFileTypeFromMime(file.type),
        file_size: file.size,
        file_path: filePath,
        uploaded_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const handleFileUpload = async (files: File[]) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files.",
        variant: "destructive",
      });
      return;
    }

    setUploadingFiles(files);
    setShowUploadDialog(true);
  };

  const confirmUpload = async () => {
    try {
      for (const file of uploadingFiles) {
        await uploadFileToSupabase(file);
        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });
      }

      setShowUploadDialog(false);
      setUploadingFiles([]);
      setNewFileIsPublic(false);
      fetchFiles();
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      const { error } = await supabase
        .from("files")
        .delete()
        .eq("id", fileId)
        .eq("uploaded_by", user?.id); // Only allow users to delete their own files

      if (error) throw error;

      toast({
        title: "File deleted",
        description: "The file has been deleted successfully.",
      });
      fetchFiles();
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete the file.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (file: DatabaseFile) => {
    try {
      // Increment download count
      await supabase
        .from("files")
        .update({ download_count: file.download_count + 1 })
        .eq("id", file.id);

      toast({
        title: "Download started",
        description: `Downloading ${file.file_name}`,
      });

      fetchFiles(); // Refresh to show updated download count
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const getFileTypeFromMime = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    return 'other';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "image":
        return <Image className="h-4 w-4 text-green-500" />;
      case "video":
        return <Video className="h-4 w-4 text-purple-500" />;
      case "audio":
        return <Music className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file =>
    file.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await handleFileUpload(files);
  };

  const publicFiles = filteredFiles.filter(file => file.uploaded_by !== user?.id);
  const myFiles = filteredFiles.filter(file => file.uploaded_by === user?.id);
  const recentFiles = filteredFiles.slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">File Management</h1>
        <div className="flex items-center space-x-2">
          <div className="bg-card border border-border rounded-lg px-3 py-1 flex items-center text-sm">
            <p className="text-muted-foreground mr-2">Storage:</p>
            <div className="w-32 mr-2">
              <Progress value={storageUsed} className="h-2" />
            </div>
            <p className="text-sm">{storageUsed}% of 500MB</p>
          </div>
          <label htmlFor="file-upload-btn">
            <Button asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </span>
            </Button>
            <input
              id="file-upload-btn"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search files..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="my-files">My Files</TabsTrigger>
          <TabsTrigger value="shared">Shared Files</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* File Upload Area */}
          <Card className={`border-2 border-dashed transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}`}>
            <CardContent
              className="p-8 text-center"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop files here, or click to browse
              </p>
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer">
                  Browse Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
                />
              </label>
            </CardContent>
          </Card>

          {/* Files Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Files</CardTitle>
              <CardDescription>
                Files from all users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.map((file) => (
                      <TableRow key={file.id} className="hover:bg-accent/50">
                        <TableCell className="flex items-center space-x-3">
                          {getFileIcon(file.file_type)}
                          <span className="font-medium">{file.file_name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{file.file_type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatFileSize(file.file_size)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{file.download_count}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownload(file)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              {file.uploaded_by === user?.id && (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteFile(file.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-files">
          <Card>
            <CardHeader>
              <CardTitle>My Files</CardTitle>
              <CardDescription>Files you have uploaded</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="flex items-center space-x-3">
                        {getFileIcon(file.file_type)}
                        <span className="font-medium">{file.file_name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{file.file_type}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(file.file_size)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{file.download_count}</Badge>
                      </TableCell>
                      <TableCell>{new Date(file.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(file.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared">
          <Card>
            <CardHeader>
              <CardTitle>Shared Files</CardTitle>
              <CardDescription>Files shared by others in the community</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="flex items-center space-x-3">
                        {getFileIcon(file.file_type)}
                        <span className="font-medium">{file.file_name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{file.file_type}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(file.file_size)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{file.download_count}</Badge>
                      </TableCell>
                      <TableCell>{new Date(file.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Files</CardTitle>
              <CardDescription>Recently uploaded files</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="flex items-center space-x-3">
                        {getFileIcon(file.file_type)}
                        <span className="font-medium">{file.file_name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{file.file_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(file.created_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Configuration Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Upload</DialogTitle>
            <DialogDescription>
              Review files before uploading
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Files to upload:</Label>
              <div className="mt-2 space-y-2">
                {uploadingFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-accent/30 rounded">
                    {getFileIcon(getFileTypeFromMime(file.type))}
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmUpload}>
                Upload Files
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};