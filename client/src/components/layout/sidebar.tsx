import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Building,
  Folder, 
  CheckSquare, 
  BarChart3,
  Users,
  Grid3X3,
  LogOut,
  Shield,
  User,
  DollarSign,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Clients", href: "/clients", icon: Building },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Applications", href: "/applications", icon: Grid3X3 },
  { name: "My Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Money Tracking", href: "/money", icon: DollarSign },
  { name: "Team", href: "/team", icon: Users },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/auth/logout", "POST");
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Quicksand', sans-serif" }}>
          <CheckSquare className="inline-block w-6 h-6 text-primary mr-2" />
          Project Manager
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-gray-700 hover:bg-gray-100"
              )} style={{ fontFamily: "'Quicksand', sans-serif" }}>
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </div>
            </Link>
          );
        })}
        
        {/* Admin-only navigation */}
        {user?.role === 'admin' && (
          <div className="mt-6">
            <div className="px-3 mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                Admin
              </p>
            </div>
            <Link href="/teams">
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                location === "/teams"
                  ? "text-primary bg-primary/10"
                  : "text-gray-700 hover:bg-gray-100"
              )} style={{ fontFamily: "'Quicksand', sans-serif" }}>
                <Users className="w-5 h-5 mr-3" />
                Team Management
              </div>
            </Link>
            <Link href="/user-management">
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                location === "/user-management"
                  ? "text-primary bg-primary/10"
                  : "text-gray-700 hover:bg-gray-100"
              )} style={{ fontFamily: "'Quicksand', sans-serif" }}>
                <Shield className="w-5 h-5 mr-3" />
                User Management
              </div>
            </Link>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.username || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              {user?.role || 'Member'}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-700 hover:bg-gray-100"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          style={{ fontFamily: "'Quicksand', sans-serif" }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  );
}
