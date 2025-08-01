import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Upload,
} from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  max_score: number;
  status: string;
  course_name: string;
  course_code: string;
  course_id: string;
  created_at: string;
  submission?: {
    id: string;
    content: string;
    submitted_at: string;
    score?: number;
    feedback?: string;
    status: string;
  };
}

interface Course {
  id: string;
  name: string;
  course_code: string;
}

interface AssignmentManagementProps {
  userType: "student" | "lecturer";
}

export const AssignmentManagement = ({ userType }: AssignmentManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    instructions: "",
    due_date: "",
    max_score: 100,
    course_id: "",
  });

  useEffect(() => {
    if (user) {
      fetchAssignments();
      fetchCourses();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("assignments")
        .select(`
          id,
          title,
          description,
          instructions,
          due_date,
          max_score,
          status,
          course_id,
          created_at,
          courses:course_id (
            name,
            course_code
          )
        `)
        .order("due_date", { ascending: true });

      if (userType === "student") {
        // Students only see assignments from enrolled courses
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("student_id", user?.id);
        
        const courseIds = enrollments?.map(e => e.course_id) || [];
        if (courseIds.length > 0) {
          query = query.in("course_id", courseIds);
        }
      } else {
        // Lecturers only see assignments from their courses
        const { data: lecturerCourses } = await supabase
          .from("courses")
          .select("id")
          .eq("lecturer_id", user?.id);
        
        const courseIds = lecturerCourses?.map(c => c.id) || [];
        if (courseIds.length > 0) {
          query = query.in("course_id", courseIds);
        }
      }

      const { data: assignmentsData, error } = await query;
      if (error) throw error;

      // Fetch submissions for students
      if (userType === "student" && assignmentsData) {
        const assignmentIds = assignmentsData.map(a => a.id);
        const { data: submissions } = await supabase
          .from("assignment_submissions")
          .select("*")
          .eq("student_id", user?.id)
          .in("assignment_id", assignmentIds);

        const submissionsMap = new Map();
        submissions?.forEach(sub => {
          submissionsMap.set(sub.assignment_id, sub);
        });

        const enrichedAssignments = assignmentsData.map(assignment => ({
          ...assignment,
          course_name: assignment.courses?.name || "Unknown Course",
          course_code: assignment.courses?.course_code || "Unknown",
          submission: submissionsMap.get(assignment.id),
        }));

        setAssignments(enrichedAssignments);
      } else {
        const enrichedAssignments = assignmentsData?.map(assignment => ({
          ...assignment,
          course_name: assignment.courses?.name || "Unknown Course",
          course_code: assignment.courses?.course_code || "Unknown",
        })) || [];

        setAssignments(enrichedAssignments);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
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

      if (userType === "lecturer") {
        query = query.eq("lecturer_id", user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleCreateAssignment = async () => {
    if (!user || userType !== "lecturer") return;

    try {
      const { data, error } = await supabase
        .from("assignments")
        .insert({
          ...newAssignment,
          created_by: user.id,
          status: "published",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment created successfully",
      });

      setShowCreateDialog(false);
      setNewAssignment({
        title: "",
        description: "",
        instructions: "",
        due_date: "",
        max_score: 100,
        course_id: "",
      });
      await fetchAssignments();
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
      });
    }
  };

  const handleSubmitAssignment = async () => {
    if (!user || !selectedAssignment || !submissionContent.trim()) return;

    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from("assignment_submissions")
        .upsert({
          assignment_id: selectedAssignment.id,
          student_id: user.id,
          content: submissionContent,
          status: "submitted",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment submitted successfully",
      });

      setSubmissionContent("");
      setSelectedAssignment(null);
      await fetchAssignments();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast({
        title: "Error",
        description: "Failed to submit assignment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const hasSubmission = assignment.submission;

    if (userType === "student") {
      if (hasSubmission) {
        if (hasSubmission.score !== null && hasSubmission.score !== undefined) {
          return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Graded</Badge>;
        }
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>;
      }
      
      if (now > dueDate) {
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      }
      
      return <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />Pending</Badge>;
    }

    return <Badge variant="default">{assignment.status}</Badge>;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const pendingAssignments = assignments.filter(a => 
    userType === "student" ? !a.submission && new Date(a.due_date) > new Date() : true
  );
  
  const submittedAssignments = assignments.filter(a => 
    userType === "student" ? a.submission : true
  );

  const overdueAssignments = assignments.filter(a => 
    userType === "student" ? !a.submission && new Date(a.due_date) < new Date() : true
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assignment Management</h1>
        {userType === "lecturer" && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Create a new assignment for your students
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Assignment title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Course</label>
                  <select
                    value={newAssignment.course_id}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, course_id: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the assignment"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Instructions</label>
                  <Textarea
                    value={newAssignment.instructions}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Detailed instructions for the assignment"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="datetime-local"
                      value={newAssignment.due_date}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Score</label>
                    <Input
                      type="number"
                      value={newAssignment.max_score}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, max_score: parseInt(e.target.value) }))}
                      min="1"
                      max="1000"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAssignment} disabled={!newAssignment.title || !newAssignment.course_id}>
                    Create Assignment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingAssignments.length})
            </TabsTrigger>
            {userType === "student" && (
              <>
                <TabsTrigger value="submitted">
                  Submitted ({submittedAssignments.length})
                </TabsTrigger>
                <TabsTrigger value="overdue">
                  Overdue ({overdueAssignments.length})
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="all">All ({assignments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingAssignments.map((assignment) => (
                <Card key={assignment.id} className="hover-lift">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{assignment.title}</CardTitle>
                        <CardDescription>
                          {assignment.course_code} - {assignment.course_name}
                        </CardDescription>
                      </div>
                      {getStatusBadge(assignment)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {assignment.description}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span>{new Date(assignment.due_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Max Score:</span>
                        <span>{assignment.max_score} points</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium">{getDaysUntilDue(assignment.due_date)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>{assignment.title}</DialogTitle>
                            <DialogDescription>
                              {assignment.course_code} - Due {new Date(assignment.due_date).toLocaleDateString()}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Description</h4>
                              <p className="text-sm text-muted-foreground">{assignment.description}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Instructions</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {assignment.instructions}
                              </p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {userType === "student" && !assignment.submission && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => setSelectedAssignment(assignment)}>
                              <Upload className="h-4 w-4 mr-2" />
                              Submit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Submit Assignment</DialogTitle>
                              <DialogDescription>
                                Submit your work for {assignment.title}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Enter your assignment submission here..."
                                value={submissionContent}
                                onChange={(e) => setSubmissionContent(e.target.value)}
                                rows={8}
                              />
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline">Cancel</Button>
                                <Button 
                                  onClick={handleSubmitAssignment}
                                  disabled={!submissionContent.trim() || isSubmitting}
                                >
                                  {isSubmitting ? "Submitting..." : "Submit Assignment"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {userType === "student" && (
            <>
              <TabsContent value="submitted">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {submittedAssignments.map((assignment) => (
                    <Card key={assignment.id} className="hover-lift border-green-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{assignment.title}</CardTitle>
                            <CardDescription>
                              {assignment.course_code} - {assignment.course_name}
                            </CardDescription>
                          </div>
                          {getStatusBadge(assignment)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {assignment.submission && (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Submitted:</span>
                              <span>{new Date(assignment.submission.submitted_at).toLocaleDateString()}</span>
                            </div>
                            {assignment.submission.score !== null && assignment.submission.score !== undefined && (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Score:</span>
                                  <span className="font-medium">
                                    {assignment.submission.score}/{assignment.max_score}
                                  </span>
                                </div>
                                <div className="w-full">
                                  <Progress 
                                    value={(assignment.submission.score / assignment.max_score) * 100} 
                                    className="h-2" 
                                  />
                                </div>
                              </>
                            )}
                            {assignment.submission.feedback && (
                              <div>
                                <span className="text-muted-foreground text-xs">Feedback:</span>
                                <p className="text-sm mt-1 p-2 bg-muted rounded">
                                  {assignment.submission.feedback}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="overdue">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {overdueAssignments.map((assignment) => (
                    <Card key={assignment.id} className="hover-lift border-red-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{assignment.title}</CardTitle>
                            <CardDescription>
                              {assignment.course_code} - {assignment.course_name}
                            </CardDescription>
                          </div>
                          {getStatusBadge(assignment)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {assignment.description}
                        </p>
                        
                        <div className="text-sm text-destructive font-medium">
                          {getDaysUntilDue(assignment.due_date)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </>
          )}

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="hover-lift">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{assignment.title}</CardTitle>
                        <CardDescription>
                          {assignment.course_code} - {assignment.course_name}
                        </CardDescription>
                      </div>
                      {getStatusBadge(assignment)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {assignment.description}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span>{new Date(assignment.due_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Max Score:</span>
                        <span>{assignment.max_score} points</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {assignments.length === 0 && !loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
              <p className="text-muted-foreground">
                {userType === "lecturer" 
                  ? "Create your first assignment to get started" 
                  : "No assignments have been posted yet"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};