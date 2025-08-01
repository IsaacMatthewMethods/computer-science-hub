import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Download,
  FileText,
  Video,
  Image,
  Archive,
  Search,
  Filter,
  Star,
  Eye,
  Calendar,
  User,
  BookOpen,
  Trash2,
} from "lucide-react";

interface FileItem {
  id: string;
  filename: string;
  title?: string;
  description?: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  uploaded_by: string;
  uploader_name?: string;
  course_name?: string;
  course_id?: string;
  category?: string;
  download_count: number;
  is_featured: boolean;
  tags?: string[];
}

interface Course {
  id: string;
  name: string;
  course_code: string;
}

interface EnhancedFileManagementProps {
  userType: "student" | "lecturer";
}

export const EnhancedFileManagement = ({ userType }: EnhancedFileManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const categories = [
    { value: "all", label: "All Files", icon: FileText },
    { value: "document", label: "Documents", icon: FileText },
    { value: "video", label: "Videos", icon: Video },
    { value: "image", label: "Images", icon: Image },
    { value: "archive", label: "Archives", icon: Archive },
  ];

  useEffect(() => {
    if (user) {
      fetchFiles();
      fetchCourses();
    }
  }, [user]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("files")
        .select(`
          id,
          filename,
          title,
          description,
          file_type,
          file_size,
          created_at,
          uploaded_by,
          course_id,
          category,
          download_count,
          is_featured,
          tags,
          profiles:uploaded_by (
            first_name,
            last_name
          ),
          courses:course_id (
            name,
            course_code
          )
        `)
        .order("created_at", { ascending: false });

      if (userType === "student") {
        // Students can only see public files and files from enrolled courses
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("student_id", user?.id);
        
        const courseIds = enrollments?.map(e => e.course_id) || [];
        if (courseIds.length > 0) {
          query = query.or(`is_public.eq.true,course_id.in.(${courseIds.map(id => `"${id}"`).join(",")})`);
        } else {
          query = query.eq("is_public", true);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedFiles: FileItem[] = data?.map((file: any) => ({
        id: file.id,
        filename: file.filename,
        title: file.title,
        description: file.description,
        file_type: file.file_type || "other",
        file_size: file.file_size,
        upload_date: file.created_at,
        uploaded_by: file.uploaded_by,
        uploader_name: file.profiles 
          ? `${file.profiles.first_name || ""} ${file.profiles.last_name || ""}`.trim() || "Unknown User"
          : "Unknown User",
        course_name: file.courses?.name,
        course_id: file.course_id,
        category: file.category,
        download_count: file.download_count || 0,
        is_featured: file.is_featured || false,
        tags: file.tags || [],
      })) || [];

      setFiles(formattedFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      let query = supabase
        .from("courses")
        .select("id, name, course_code")
        .eq("is_active", true);

      if (userType === "student") {
        // Students can only see enrolled courses  
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("student_id", user?.id);
        
        const courseIds = enrollments?.map(e => e.course_id) || [];
        if (courseIds.length > 0) {
          query = query.in("id", courseIds);
        }
      } else {
        // Lecturers can see their courses
        query = query.eq("lecturer_id", user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload file to storage bucket would go here
      // For now, just simulate the upload

      // Create file record in database
      const { data, error } = await supabase
        .from("files")
        .insert({
          filename: file.name,
          title: file.name.split('.')[0],
          file_type: file.type.split('/')[0] || "other",
          file_size: file.size,
          uploaded_by: user.id,
          file_path: `/uploads/${file.name}`,
          is_public: userType === "lecturer",
          category: file.type.split('/')[0] || "other",
        })
        .select()
        .single();

      if (error) throw error;

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      await fetchFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      // Increment download count
      const { error: updateError } = await supabase
        .from("files")
        .update({ download_count: (await supabase.from("files").select("download_count").eq("id", fileId).single()).data?.download_count || 0 + 1 })
        .eq("id", fileId);

      toast({
        title: "Download started",
        description: `Downloading ${filename}`,
      });

      await fetchFiles(); // Refresh to show updated download count
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async (fileId: string, currentStatus: boolean) => {
    if (userType !== "lecturer") return;

    try {
      await supabase
        .from("files")
        .update({ is_featured: !currentStatus })
        .eq("id", fileId);

      toast({
        title: "Success",
        description: `File ${!currentStatus ? "featured" : "unfeatured"}`,
      });

      await fetchFiles();
    } catch (error) {
      console.error("Error toggling featured status:", error);
      toast({
        title: "Error",
        description: "Failed to update file",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "video":
        return Video;
      case "image":
        return Image;
      case "application":
        return Archive;
      default:
        return FileText;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = 
      file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || file.category === selectedCategory;
    const matchesCourse = selectedCourse === "all" || file.course_id === selectedCourse;
    
    return matchesSearch && matchesCategory && matchesCourse;
  });

  const featuredFiles = filteredFiles.filter(file => file.is_featured);
  const regularFiles = filteredFiles.filter(file => !file.is_featured);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">File Management</h1>
        {userType === "lecturer" && (
          <div className="flex items-center gap-2">
            <Input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label htmlFor="file-upload">
              <Button asChild disabled={isUploading}>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </span>
              </Button>
            </label>
          </div>
        )}
      </div>

      {isUploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Files ({filteredFiles.length})</TabsTrigger>
          {featuredFiles.length > 0 && (
            <TabsTrigger value="featured">Featured ({featuredFiles.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No files found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Try adjusting your search criteria" : "No files have been uploaded yet"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...featuredFiles, ...regularFiles].map((file) => {
                const FileIcon = getFileIcon(file.file_type);
                return (
                  <Card key={file.id} className="hover-lift">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <FileIcon className="h-5 w-5 text-primary" />
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm truncate">
                              {file.title || file.filename}
                            </CardTitle>
                            {file.is_featured && (
                              <Badge variant="secondary" className="mt-1">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                        {userType === "lecturer" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFeatured(file.id, file.is_featured)}
                          >
                            <Star className={`h-4 w-4 ${file.is_featured ? "fill-current" : ""}`} />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {file.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {file.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Size</span>
                          <span>{formatFileSize(file.file_size)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Downloads</span>
                          <span>{file.download_count}</span>
                        </div>
                        {file.course_name && (
                          <div className="flex items-center justify-between">
                            <span>Course</span>
                            <Badge variant="outline" className="text-xs">
                              {file.course_name}
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span>Uploaded by</span>
                          <span>{file.uploader_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Date</span>
                          <span>{new Date(file.upload_date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {file.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file.id, file.filename)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Eye className="h-3 w-3 mr-1" />
                          {file.download_count} downloads
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="featured">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredFiles.map((file) => {
              const FileIcon = getFileIcon(file.file_type);
              return (
                <Card key={file.id} className="hover-lift border-primary/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <FileIcon className="h-5 w-5 text-primary" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm truncate">
                            {file.title || file.filename}
                          </CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {file.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {file.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.id, file.filename)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Eye className="h-3 w-3 mr-1" />
                        {file.download_count} downloads
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};