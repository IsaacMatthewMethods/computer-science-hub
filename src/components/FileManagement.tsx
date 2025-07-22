import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  File,
  FileText,
  Film,
  Image as ImageIcon,
  MoreVertical,
  Download,
  Trash,
  Share,
  Link,
  Upload,
  FolderPlus,
  Search,
  Filter,
  BookOpen,
  ListFilter,
  Code,
} from "lucide-react";

interface FileItem {
  id: string;
  name: string;
  type: "document" | "image" | "video" | "pdf" | "code" | "other";
  size: string;
  dateAdded: string;
  shared: boolean;
  category?: string;
  course?: string;
}

interface FolderItem {
  id: string;
  name: string;
  filesCount: number;
  dateCreated: string;
}

interface FileManagementProps {
  userType: "student" | "lecturer";
}

export function FileManagement({ userType }: FileManagementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [storageUsed, setStorageUsed] = useState(45);

  const files: FileItem[] = [
    {
      id: "file1",
      name: "Data Structures Assignment.pdf",
      type: "pdf",
      size: "2.5 MB",
      dateAdded: "Today",
      shared: true,
      course: "CS301",
    },
    {
      id: "file2",
      name: "Algorithm Analysis Slides.pdf",
      type: "pdf",
      size: "4.7 MB",
      dateAdded: "Yesterday",
      shared: true,
      course: "CS301",
    },
    {
      id: "file3",
      name: "Project Documentation.docx",
      type: "document",
      size: "1.2 MB",
      dateAdded: "2 days ago",
      shared: false,
      course: "CS401",
    },
    {
      id: "file4",
      name: "Neural Networks Visualization.png",
      type: "image",
      size: "3.8 MB",
      dateAdded: "3 days ago",
      shared: true,
      course: "CS502",
    },
    {
      id: "file5",
      name: "Database Tutorial.mp4",
      type: "video",
      size: "78.5 MB",
      dateAdded: "1 week ago",
      shared: true,
      course: "CS401",
    },
    {
      id: "file6",
      name: "Machine Learning Model.ipynb",
      type: "code",
      size: "1.1 MB",
      dateAdded: "1 week ago",
      shared: false,
      course: "CS502",
    },
  ];

  const folders: FolderItem[] = [
    {
      id: "folder1",
      name: "Assignments",
      filesCount: 12,
      dateCreated: "2 weeks ago",
    },
    {
      id: "folder2",
      name: "Lecture Notes",
      filesCount: 24,
      dateCreated: "1 month ago",
    },
    {
      id: "folder3",
      name: "Project Resources",
      filesCount: 8,
      dateCreated: "3 weeks ago",
    },
    {
      id: "folder4",
      name: "Shared with Me",
      filesCount: 16,
      dateCreated: "2 months ago",
    },
  ];

  const getFileIcon = (type: FileItem["type"]) => {
    switch (type) {
      case "document":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "image":
        return <ImageIcon className="h-5 w-5 text-green-500" />;
      case "video":
        return <Film className="h-5 w-5 text-purple-500" />;
      case "pdf":
        return <File className="h-5 w-5 text-red-500" />;
      case "code":
        return <Code className="h-5 w-5 text-orange-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // Handle file drop logic here
    const droppedFiles = Array.from(e.dataTransfer.files);
    console.log("Files dropped:", droppedFiles);

    // In a real implementation, you would process these files
    // But for this demo, we'll just log them
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const uploadedFiles = Array.from(e.target.files);
      console.log("Files selected:", uploadedFiles);
      
      // In a real implementation, you would process these files
      // But for this demo, we'll just log them
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {userType === "student" ? "My Files" : "Resource Management"}
          </h1>
          <p className="text-muted-foreground">
            {userType === "student"
              ? "Manage and access your files and resources"
              : "Organize and share resources with students"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-card border border-border rounded-lg px-3 py-1 flex items-center text-sm">
            <p className="text-muted-foreground mr-2">Storage:</p>
            <div className="w-32 mr-2">
              <Progress value={storageUsed} className="h-2" />
            </div>
            <p className="text-sm">{storageUsed}% of 500MB</p>
          </div>
          <Button size="sm" className="bg-gradient-primary hover-glow">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button size="sm" variant="outline" className="hover-lift">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              className="pl-8 pr-4 py-2 w-full bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="flex items-center">
              <ListFilter className="h-4 w-4 mr-2" />
              Sort
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Course
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>All Courses</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>CS301 - Data Structures</DropdownMenuItem>
                <DropdownMenuItem>CS401 - Database Systems</DropdownMenuItem>
                <DropdownMenuItem>CS502 - Machine Learning</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
          {userType === "lecturer" && (
            <TabsTrigger value="published">Published Resources</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* File Upload Area */}
          <div 
            className={`file-upload-area ${isDragging ? "drag-over" : ""} animate-scale-in`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">Drag and drop files here</h3>
              <p className="text-muted-foreground mb-4">or</p>
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="bg-gradient-primary text-primary-foreground px-4 py-2 rounded-lg hover-glow transition-all duration-300">
                  Browse Files
                </div>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <p className="text-sm text-muted-foreground mt-4">
                Maximum file size: 50MB
              </p>
            </div>
          </div>

          {/* Files List */}
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle>Recent Files</CardTitle>
              <CardDescription>
                Your recently uploaded and accessed files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border border-border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">
                        Size
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                        Date Added
                      </th>
                      <th className="text-center p-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                        Shared
                      </th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {files.map((file) => (
                      <tr 
                        key={file.id} 
                        className="hover:bg-accent/30 transition-colors duration-200 animate-fade-in"
                      >
                        <td className="p-3 flex items-center space-x-2">
                          <div className="p-2 bg-accent rounded-md">
                            {getFileIcon(file.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            {file.course && (
                              <p className="text-xs text-muted-foreground">
                                {file.course}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">
                          {file.size}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">
                          {file.dateAdded}
                        </td>
                        <td className="p-3 text-center hidden lg:table-cell">
                          {file.shared ? (
                            <Badge variant="secondary" className="bg-success/20 text-success">
                              Shared
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Private
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end items-center space-x-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Share className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Link className="h-4 w-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="folders" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {folders.map((folder, index) => (
              <Card 
                key={folder.id} 
                className="hover-lift shadow-soft animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <File className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{folder.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {folder.filesCount} files
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Share className="h-4 w-4 mr-2" />
                          Share Folder
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download All
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Created {folder.dateCreated}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4 hover-lift">
                    Open Folder
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4 animate-fade-in">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Shared Files</CardTitle>
              <CardDescription>Files that have been shared with you or by you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border border-border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">
                        Size
                      </th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                        Shared By
                      </th>
                      <th className="text-center p-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                        Course
                      </th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {files.filter(file => file.shared).map((file) => (
                      <tr 
                        key={file.id} 
                        className="hover:bg-accent/30 transition-colors duration-200"
                      >
                        <td className="p-3 flex items-center space-x-2">
                          <div className="p-2 bg-accent rounded-md">
                            {getFileIcon(file.type)}
                          </div>
                          <p className="text-sm font-medium">{file.name}</p>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">
                          {file.size}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">
                          Dr. Smith
                        </td>
                        <td className="p-3 text-center hidden lg:table-cell">
                          <Badge variant="outline">{file.course}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end items-center space-x-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Link className="h-4 w-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Share className="h-4 w-4 mr-2" />
                                  Share With Others
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {userType === "lecturer" && (
          <TabsContent value="published" className="space-y-4 animate-fade-in">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Published Resources</CardTitle>
                <CardDescription>Materials made available to all students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border border-border">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                          Title
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">
                          Type
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                          Published Date
                        </th>
                        <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                          Course
                        </th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                          Downloads
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {files.filter(file => file.shared).map((file, index) => (
                        <tr 
                          key={`pub-${file.id}`} 
                          className="hover:bg-accent/30 transition-colors duration-200"
                        >
                          <td className="p-3 flex items-center space-x-2">
                            <div className="p-2 bg-accent rounded-md">
                              {getFileIcon(file.type)}
                            </div>
                            <p className="text-sm font-medium">{file.name}</p>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground hidden md:table-cell capitalize">
                            {file.type}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">
                            {file.dateAdded}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline">{file.course}</Badge>
                          </td>
                          <td className="p-3 text-right text-sm">
                            {12 + index * 7}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}