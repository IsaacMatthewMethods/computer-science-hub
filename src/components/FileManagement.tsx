import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";

import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FolderPlus,
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
  Archive,
  MoreHorizontal,
  Eye,
  Calendar,
  Users,
  Folder,
  FileIcon,
} from "lucide-react";

interface FileItem {
  id: string; // Using name as ID for simplicity with local files
  name: string;
  type: "document" | "image" | "video" | "audio" | "other";
  size: number; // Size in bytes
  dateAdded: string;
  sharedBy: string; // Placeholder
  course: string; // Placeholder
  downloadCount: number; // Placeholder
  isShared: boolean; // Placeholder
  isPublished: boolean; // Placeholder
  url: string; // Local URL
  uploaded_by: string; // Placeholder
}

interface FileManagementProps {
  userType: "student" | "lecturer";
}

export const FileManagement = ({ userType }: FileManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const fetchFiles = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/files');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const formattedFiles: FileItem[] = data.map((file: any) => ({
        id: file.name, // Using name as ID for simplicity with local files
        name: file.name,
        type: 'document', // Defaulting to document for now, can be improved
        size: file.size,
        dateAdded: new Date(file.dateAdded).toLocaleDateString(),
        sharedBy: 'You', // Placeholder
        course: 'N/A', // Placeholder
        downloadCount: 0, // Placeholder
        isShared: false, // Placeholder
        isPublished: false, // Placeholder
        url: `http://localhost:3001${file.path}`,
        uploaded_by: user?.id || 'unknown', // Placeholder
      }));

      setFiles(formattedFiles);
      const totalSize = formattedFiles.reduce((sum, file) => sum + file.size, 0);
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
  }, [user, toast]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  

  const getFileIcon = (type: FileItem["type"]) => {
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
    await uploadFiles(files);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      await uploadFiles(Array.from(files));
    }
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files.",
        variant: "destructive",
      });
      return;
    }

    for (const file of filesToUpload) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:3001/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result);

        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });
      } catch (error: any) {
        console.error("Error uploading file:", error);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}: ${error.message}`,
          variant: "destructive",
        });
      }
    }

    fetchFiles(); // Refresh the file list after uploads
  };

  const getFileTypeFromMime = (mimeType: string): FileItem["type"] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    return 'other';
  };

  const handleDeleteFile = async (fileId: string, fileName: string, uploadedBy: string) => {
    try {
      const response = await fetch(`http://localhost:3001/delete-file/${fileName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "File deleted",
        description: "The file has been deleted successfully.",
      });
      fetchFiles();
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast({
        title: "Delete failed",
        description: `Failed to delete the file: ${error.message}`,
        variant: "destructive",
      });
    }
  };

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
              onChange={handleFileUpload}
            />
          </label>
          <Button variant="outline">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search files..." className="pl-8" />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
          {userType === "lecturer" && (
            <TabsTrigger value="published">Published Resources</TabsTrigger>
          )}
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
                  onChange={handleFileUpload}
                />
              </label>
            </CardContent>
          </Card>

          {/* Files Table */}
          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
              <CardDescription>
                Your uploaded files and shared resources
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
                      <TableHead>Date Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.id} className="hover:bg-accent/50">
                        <TableCell className="flex items-center space-x-3">
                          {getFileIcon(file.type)}
                          <span className="font-medium">{file.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{file.type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{file.size}</TableCell>
                        <TableCell className="text-muted-foreground">{file.dateAdded}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
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
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteFile(file.id, file.name, file.uploaded_by)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
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

        

        <TabsContent value="shared" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shared Files</CardTitle>
              <CardDescription>
                Files shared with you or that you've shared
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Shared By</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date Shared</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.filter(file => file.isShared).map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <span>{file.name}</span>
                      </TableCell>
                      <TableCell>{file.sharedBy}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{file.course}</Badge>
                      </TableCell>
                      <TableCell>{file.dateAdded}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
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

        {userType === "lecturer" && (
          <TabsContent value="published" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Published Resources</CardTitle>
                <CardDescription>
                  Resources you've made available to students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.filter(file => file.isPublished).map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="flex items-center space-x-3">
                          {getFileIcon(file.type)}
                          <span>{file.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{file.course}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{file.downloadCount}</Badge>
                        </TableCell>
                        <TableCell>{file.dateAdded}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => window.open(file.url, "_blank")}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Share2 className="h-4 w-4" />
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
        )}
      </Tabs>
    </div>
  );
};