import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { StudentDashboard } from "@/components/StudentDashboard";
import { LecturerDashboard } from "@/components/LecturerDashboard";
import { EnhancedFileManagement } from "@/components/EnhancedFileManagement";
import { ImprovedChatSystem } from "@/components/ImprovedChatSystem";
import { CollaborationHub } from "@/components/CollaborationHub";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Save,
  BookOpen,
  Users,
  MessageSquare,
  TrendingUp,
  Award,
  Target,
  LogOut,
} from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile, saving } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [userType, setUserType] = useState<"student" | "lecturer">("student");
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    course: "",
    student_id: "",
    department: "",
  });

  // Update local state when profile changes
  useEffect(() => {
    if (profile) {
      setEditedProfile({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        bio: profile.bio || "",
        course: profile.course || "",
        student_id: profile.student_id || "",
        department: profile.department || "",
      });
      
      // Determine user type based on role
      if (profile.role === "lecturer" || profile.role === "admin") {
        setUserType("lecturer");
      } else {
        setUserType("student");
      }
    }
  }, [profile]);

  

  


  const handleSignOut = async () => {
    console.log("Attempting to sign out...");
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const toggleUserType = () => {
    setUserType(userType === "student" ? "lecturer" : "student");
  };

  const handleSaveProfile = async () => {
    if (isEditing) {
      const success = await updateProfile(editedProfile);
      if (success) {
        setIsEditing(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const getUserDisplayName = () => {
    if (!profile) return "User";
    if (profile.full_name) return profile.full_name;
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return "User";
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (profileLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const renderProfile = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <Button
          onClick={handleSaveProfile}
          disabled={saving}
          variant={isEditing ? "default" : "outline"}
          className={isEditing ? "bg-gradient-primary hover-glow" : "hover-lift"}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 shadow-soft hover-lift">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold mb-2">{getUserDisplayName()}</h2>
              <Badge className="mb-4 bg-gradient-primary text-primary-foreground">
                {userType === "student" ? "Student" : "Lecturer"}
              </Badge>
              <p className="text-sm text-muted-foreground mb-4">
                {profile?.course || "No course specified"}
              </p>
              <p className="text-sm text-muted-foreground">
                {profile?.department || "No department specified"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Information */}
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your contact details and academic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                {isEditing ? (
                  <Input
                    id="first_name"
                    value={editedProfile.first_name}
                    onChange={(e) => setEditedProfile({...editedProfile, first_name: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{profile?.first_name || "Not specified"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="last_name"
                    value={editedProfile.last_name}
                    onChange={(e) => setEditedProfile({...editedProfile, last_name: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{profile?.last_name || "Not specified"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{profile?.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{profile?.phone || "Not specified"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Address
                </Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={editedProfile.address}
                    onChange={(e) => setEditedProfile({...editedProfile, address: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{profile?.address || "Not specified"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Member Since
                </Label>
                <p className="text-sm">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              {isEditing ? (
                <Input
                  id="course"
                  value={editedProfile.course}
                  onChange={(e) => setEditedProfile({...editedProfile, course: e.target.value})}
                />
              ) : (
                <p className="text-sm">{profile?.course || "Not specified"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID</Label>
              {isEditing ? (
                <Input
                  id="student_id"
                  value={editedProfile.student_id}
                  onChange={(e) => setEditedProfile({...editedProfile, student_id: e.target.value})}
                />
              ) : (
                <p className="text-sm">{profile?.student_id || "Not specified"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              {isEditing ? (
                <Input
                  id="department"
                  value={editedProfile.department}
                  onChange={(e) => setEditedProfile({...editedProfile, department: e.target.value})}
                />
              ) : (
                <p className="text-sm">{profile?.department || "Not specified"}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                  className="min-h-[80px]"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{profile?.bio || "No bio provided"}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return userType === "student" ? (
          <StudentDashboard />
        ) : (
          <LecturerDashboard />
        );
      case "resources":
        return <EnhancedFileManagement userType={userType} pageContext="resources" />;
      case "chat":
        return <ImprovedChatSystem userType={userType} />;
      case "collaborate":
        return <CollaborationHub userType={userType} />;
      case "files":
        return <EnhancedFileManagement userType={userType} pageContext="my-files" />;
      case "students":
        return <CollaborationHub userType={userType} />;
      case "profile":
        return renderProfile();
      case "settings":
        return (
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold">Settings</h1>
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Account Type</CardTitle>
                <CardDescription>Switch between student and lecturer view (Demo only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={toggleUserType} variant="outline" className="w-full">
                  Switch to {userType === "student" ? "Lecturer" : "Student"} View
                </Button>
                <Button onClick={handleSignOut} variant="destructive" className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return userType === "student" ? (
          <StudentDashboard />
        ) : (
          <LecturerDashboard />
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation
          userType={userType}
          userName={getUserDisplayName()}
          onNavigate={handleNavigate}
          currentPage={currentPage}
          onSignOut={handleSignOut}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderCurrentPage()}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Index;
