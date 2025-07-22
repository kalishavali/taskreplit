import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Shield, 
  User, 
  Users, 
  Plus, 
  Settings, 
  Trash2, 
  Eye, 
  Edit, 
  Key,
  CheckCircle,
  XCircle 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User as UserType, Client, UserClientPermission } from "@shared/schema";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/auth/users"],
    enabled: currentUser?.role === 'admin',
  });

  // Fetch all clients for permissions management
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: currentUser?.role === 'admin',
  });

  // Fetch user permissions when a user is selected
  const { data: userPermissions = [] } = useQuery<UserClientPermission[]>({
    queryKey: ["/api/users", selectedUser?.id, "client-permissions"],
    enabled: !!selectedUser && currentUser?.role === 'admin',
  });

  // Create new user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("/api/auth/register", "POST", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users"] });
      setNewUserDialogOpen(false);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest(`/api/auth/users/${userId}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users"] });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      const response = await apiRequest(`/api/auth/users/${userId}/reset-password`, "POST", { newPassword });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users"] });
      // You could add a toast notification here if needed
    },
  });

  // Set user permissions mutation
  const setPermissionMutation = useMutation({
    mutationFn: async ({ userId, clientId, permissions }: { 
      userId: number; 
      clientId: number; 
      permissions: any; 
    }) => {
      const response = await apiRequest(
        `/api/users/${userId}/client-permissions`, 
        "POST", 
        { ...permissions, clientId }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/users", selectedUser?.id, "client-permissions"] 
      });
    },
  });

  const handlePermissionChange = (clientId: number, permission: string, value: boolean) => {
    if (!selectedUser) return;

    const currentPermission = userPermissions.find(p => p.clientId === clientId);
    const updatedPermissions = {
      canView: currentPermission?.canView ?? true,
      canEdit: currentPermission?.canEdit ?? false,
      canDelete: currentPermission?.canDelete ?? false,
      canManage: currentPermission?.canManage ?? false,
      [permission]: value,
    };

    setPermissionMutation.mutate({
      userId: selectedUser.id,
      clientId,
      permissions: updatedPermissions,
    });
  };

  const NewUserForm = () => {
    const [formData, setFormData] = useState({
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "member",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createUserMutation.mutate(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              First Name
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            />
          </div>
          <div>
            <Label htmlFor="lastName" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              Last Name
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="username" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            Username
          </Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            style={{ fontFamily: "'Quicksand', sans-serif" }}
          />
        </div>

        <div>
          <Label htmlFor="email" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            style={{ fontFamily: "'Quicksand', sans-serif" }}
          />
        </div>

        <div>
          <Label htmlFor="password" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            style={{ fontFamily: "'Quicksand', sans-serif" }}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isAdmin"
            checked={formData.role === "admin"}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, role: checked ? "admin" : "member" })
            }
          />
          <Label htmlFor="isAdmin" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            Administrator
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={createUserMutation.isPending}
          style={{ fontFamily: "'Quicksand', sans-serif" }}
        >
          {createUserMutation.isPending ? "Creating..." : "Create User"}
        </Button>
      </form>
    );
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You need administrator privileges to access user management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            User Management
          </h1>
          <p className="text-gray-600 mt-2" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            Manage users and their project permissions
          </p>
        </div>

        <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
          <DialogTrigger asChild>
            <Button style={{ fontFamily: "'Quicksand', sans-serif" }}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "'Quicksand', sans-serif" }}>
                Create New User
              </DialogTitle>
              <DialogDescription>
                Create a new user account and set their permissions.
              </DialogDescription>
            </DialogHeader>
            <NewUserForm />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="permissions" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            <Settings className="w-4 h-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4">
            {usersLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p style={{ fontFamily: "'Quicksand', sans-serif" }}>Loading users...</p>
              </div>
            ) : (
              users.map((user) => (
                <Card key={user.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {user.role === 'admin' ? (
                            <Shield className="w-6 h-6" />
                          ) : (
                            <User className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.username}
                          </h3>
                          <p className="text-gray-600" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                            {user.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                            {user.isActive ? (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setPermissionsDialogOpen(true);
                          }}
                          style={{ fontFamily: "'Quicksand', sans-serif" }}
                        >
                          <Key className="w-4 h-4 mr-1" />
                          Permissions
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewPassword("");
                            setResetPasswordDialogOpen(true);
                          }}
                          style={{ fontFamily: "'Quicksand', sans-serif" }}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Reset Password
                        </Button>
                        
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${user.username}?`)) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                            disabled={deleteUserMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                            style={{ fontFamily: "'Quicksand', sans-serif" }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: "'Quicksand', sans-serif" }}>
                Client Permissions Overview
              </CardTitle>
              <CardDescription>
                View and manage user permissions across all clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                Select a user from the Users tab to manage their client permissions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Quicksand', sans-serif" }}>
              Client Permissions for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
            <DialogDescription>
              Set what this user can do in each client
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {clients.map((client: any) => {
              const permission = userPermissions.find(p => p.clientId === client.id);
              
              return (
                <Card key={client.id}>
                  <CardHeader>
                    <CardTitle className="text-lg" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                      {client.name}
                    </CardTitle>
                    <CardDescription>{client.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={permission?.canView ?? false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(client.id, 'canView', checked)
                          }
                          disabled={setPermissionMutation.isPending}
                        />
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <Label style={{ fontFamily: "'Quicksand', sans-serif" }}>View</Label>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={permission?.canEdit ?? false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(client.id, 'canEdit', checked)
                          }
                          disabled={setPermissionMutation.isPending}
                        />
                        <div className="flex items-center space-x-1">
                          <Edit className="w-4 h-4" />
                          <Label style={{ fontFamily: "'Quicksand', sans-serif" }}>Edit</Label>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={permission?.canDelete ?? false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(client.id, 'canDelete', checked)
                          }
                          disabled={setPermissionMutation.isPending}
                        />
                        <div className="flex items-center space-x-1">
                          <Trash2 className="w-4 h-4" />
                          <Label style={{ fontFamily: "'Quicksand', sans-serif" }}>Delete</Label>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={permission?.canManage ?? false}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(client.id, 'canManage', checked)
                          }
                          disabled={setPermissionMutation.isPending}
                        />
                        <div className="flex items-center space-x-1">
                          <Settings className="w-4 h-4" />
                          <Label style={{ fontFamily: "'Quicksand', sans-serif" }}>Manage</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Quicksand', sans-serif" }}>
              Reset Password for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
            <DialogDescription>
              Enter a new password for this user
            </DialogDescription>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedUser && newPassword.trim()) {
                resetPasswordMutation.mutate({ 
                  userId: selectedUser.id, 
                  newPassword: newPassword.trim() 
                });
                setResetPasswordDialogOpen(false);
                setNewPassword("");
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="newPassword" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              />
              <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                Password must be at least 6 characters long
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setResetPasswordDialogOpen(false);
                  setNewPassword("");
                }}
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending || !newPassword.trim()}
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}