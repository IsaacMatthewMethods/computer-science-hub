import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { StudentDashboard } from "@/components/StudentDashboard";
import { LecturerDashboard } from "@/components/LecturerDashboard";
import { SimplifiedFileManagement } from "@/components/SimplifiedFileManagement";
import { ImprovedChatSystem } from "@/components/ImprovedChatSystem";
import { CollaborationHub } from "@/components/CollaborationHub";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface UserProfileData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  university?: string;
  created_at: string;
  bio?: string;
  course?: string;
  education_level?: string;
}

const Index = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [userType, setUserType] = useState<"student" | "lecturer">("student");
  const [userName, setUserName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  // User profile data from database
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    joinDate: "",
    bio: "",
    course: "",
    year: "",
    skills: [] as string[],
    achievements: [] as string[],
  });

  

  


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

  const renderProfile = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "default" : "outline"}
          className={isEditing ? "bg-gradient-primary hover-glow" : "hover-lift"}
        >
          {isEditing ? (
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
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                  {userProfile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {isEditing ? (
                <Input
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                  className="text-center text-xl font-bold mb-2"
                />
              ) : (
                <h2 className="text-xl font-bold mb-2">{userProfile.name}</h2>
              )}
              <Badge className="mb-4 bg-gradient-primary text-primary-foreground">
                {userType === "student" ? "Student" : "Lecturer"}
              </Badge>
              <p className="text-sm text-muted-foreground mb-4">
                {userProfile.course}
              </p>
              <p className="text-sm text-muted-foreground">
                {userProfile.year}
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
                <Label htmlFor="email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{userProfile.email}</p>
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
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{userProfile.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Location
                </Label>
                {isEditing ? (
                  <Input
                    id="location"
                    value={userProfile.location}
                    onChange={(e) => setUserProfile({...userProfile, location: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{userProfile.location}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Member Since
                </Label>
                <p className="text-sm">{userProfile.joinDate}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <textarea
                  id="bio"
                  value={userProfile.bio}
                  onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                  className="w-full p-2 border border-input rounded-md bg-background text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{userProfile.bio}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="shadow-soft hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userProfile.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="animate-scale-in">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="lg:col-span-2 shadow-soft hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userProfile.achievements.map((achievement, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-3 p-3 bg-accent/30 rounded-lg animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-sm">{achievement}</span>
                </div>
              ))}
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
        return <SimplifiedFileManagement userType={userType} />;
      case "chat":
        return <ImprovedChatSystem userType={userType} />;
      case "collaborate":
        return <CollaborationHub userType={userType} />;
      case "files":
        return <SimplifiedFileManagement userType={userType} />;
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
          userName={userName}
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
