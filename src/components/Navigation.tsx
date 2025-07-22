import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  MessageCircle,
  Upload,
  Users,
  Settings,
  Bell,
  Search,
  Home,
  Files,
  User,
  LogOut,
} from "lucide-react";

interface NavigationProps {
  userType: "student" | "lecturer";
  userName: string;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Navigation({ userType, userName, onNavigate, currentPage }: NavigationProps) {
  const [notifications] = useState(3);

  const navItems = userType === "student" 
    ? [
        { id: "dashboard", label: "Dashboard", icon: Home },
        { id: "resources", label: "Resources", icon: BookOpen },
        { id: "chat", label: "Chat", icon: MessageCircle },
        { id: "collaborate", label: "Collaborate", icon: Users },
        { id: "files", label: "My Files", icon: Files },
      ]
    : [
        { id: "dashboard", label: "Dashboard", icon: Home },
        { id: "resources", label: "Share Resources", icon: Upload },
        { id: "students", label: "Students", icon: Users },
        { id: "chat", label: "Messages", icon: MessageCircle },
        { id: "files", label: "Files", icon: Files },
      ];

  return (
    <nav className="bg-card border-b border-border shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center animate-pulse-glow">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="ml-2 text-xl font-bold text-foreground">
                EduCollab
              </span>
              <Badge 
                variant="secondary" 
                className="ml-2 animate-bounce-in bg-success text-success-foreground"
              >
                {userType === "student" ? "Student" : "Lecturer"}
              </Badge>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`hover-lift ${isActive ? "bg-gradient-primary" : ""}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hover-glow relative">
              <Search className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="hover-glow relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground animate-pulse-glow"
                >
                  {notifications}
                </Badge>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover-lift">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={userName} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 animate-scale-in" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userType}@educollab.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate("profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate("settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}