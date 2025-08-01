import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, Building, Users, ArrowLeft, FolderOpen, Calendar, Layers, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import type { Client, Project } from "@shared/schema";

export default function Clients() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({ name: "", description: "" });
  const [editClient, setEditClient] = useState({ name: "", description: "" });
  const [newProject, setNewProject] = useState({ 
    name: "", 
    description: "", 
    color: "blue", 
    status: "active" 
  });
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const createMutation = useMutation({
    mutationFn: async (clientData: { name: string; description: string }) => {
      return await apiRequest("/api/clients", "POST", clientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsCreateModalOpen(false);
      setNewClient({ name: "", description: "" });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; updates: { name: string; description: string } }) => {
      return await apiRequest(`/api/clients/${data.id}`, "PATCH", data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsEditModalOpen(false);
      setSelectedClient(null);
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/clients/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: { name: string; description: string; color: string; status: string; clientId: number }) => {
      return await apiRequest("/api/projects", "POST", projectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateProjectModalOpen(false);
      setNewProject({ name: "", description: "", color: "blue", status: "active" });
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const unassignProjectMutation = useMutation({
    mutationFn: async ({ projectId, updateData }: { projectId: number; updateData: any }) => {
      return await apiRequest(`/api/projects/${projectId}`, "PATCH", updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project unassigned from client successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to unassign project",
        variant: "destructive",
      });
    },
  });



  const handleCreateClient = () => {
    if (newClient.name.trim()) {
      createMutation.mutate(newClient);
    }
  };

  const handleEditClient = () => {
    if (selectedClient && editClient.name.trim()) {
      updateMutation.mutate({
        id: selectedClient.id,
        updates: editClient,
      });
    }
  };

  const handleDeleteClient = (client: Client) => {
    if (confirm(`Are you sure you want to delete "${client.name}"? This will also delete all associated projects.`)) {
      deleteMutation.mutate(client.id);
    }
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setEditClient({ name: client.name, description: client.description || "" });
    setIsEditModalOpen(true);
  };

  const getProjectCount = (clientId: number) => {
    return (projects as any[]).filter((project: any) => project.clientId === clientId).length;
  };

  const getClientTaskCounts = (clientId: number) => {
    const clientProjects = (projects as any[]).filter((project: any) => project.clientId === clientId);
    const clientProjectIds = clientProjects.map(p => p.id);
    return (tasks as any[]).filter((task: any) => clientProjectIds.includes(task.projectId)).length;
  };

  const getClientProjects = (clientId: number) => {
    return (projects as any[]).filter((project: any) => project.clientId === clientId);
  };

  const getAvailableProjects = () => {
    if (!viewingClient) return [];
    // Get all projects that are unassigned (clientId is null or undefined)
    return (projects as any[]).filter((project: any) => project.clientId === null || project.clientId === undefined);
  };

  const handleAssignProjects = async () => {
    if (!viewingClient || selectedProjectIds.length === 0) return;
    
    try {
      // Update each selected project to assign it to this client
      for (const projectId of selectedProjectIds) {
        await apiRequest(`/api/projects/${projectId}`, "PATCH", { clientId: viewingClient.id });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsAddProjectModalOpen(false);
      setSelectedProjectIds([]);
      toast({
        title: "Success",
        description: `${selectedProjectIds.length} project(s) assigned successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign projects",
        variant: "destructive",
      });
    }
  };

  const getProjectTaskCounts = (projectId: number) => {
    const projectTasks = (tasks as any[]).filter((task: any) => task.projectId === projectId);
    return {
      total: projectTasks.length,
      open: projectTasks.filter((task: any) => task.status === "Open").length,
      inProgress: projectTasks.filter((task: any) => task.status === "InProgress").length,
      closed: projectTasks.filter((task: any) => task.status === "Closed").length,
    };
  };

  const getProjectProgress = (projectId: number) => {
    const taskCounts = getProjectTaskCounts(projectId);
    if (taskCounts.total === 0) return 0;
    return Math.round(((taskCounts.closed) / taskCounts.total) * 100);
  };

  const handleCreateProject = () => {
    if (viewingClient && newProject.name.trim()) {
      console.log("Creating project:", { ...newProject, clientId: viewingClient.id });
      createProjectMutation.mutate({
        ...newProject,
        clientId: viewingClient.id,
      });
    } else {
      console.log("Cannot create project:", { viewingClient, newProjectName: newProject.name.trim() });
    }
  };



  const handleUnassignProject = (project: any) => {
    console.log("Directly unassigning project:", project.name);
    
    // Directly unassign without confirmation
    const updateData = { clientId: null };
    unassignProjectMutation.mutate({ 
      projectId: project.id, 
      updateData 
    }, {
      onSuccess: () => {
        console.log("Project unassigned successfully");
        toast({
          title: "Success",
          description: `${project.name} has been unassigned from ${viewingClient?.name}`,
        });
      },
      onError: (error: Error) => {
        console.error("Unassignment failed:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to unassign project",
          variant: "destructive",
        });
      }
    });
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If viewing a specific client, show client details with projects
  if (viewingClient) {
    const clientProjects = getClientProjects(viewingClient.id);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Client Details Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setViewingClient(null)}
                className="hover:bg-white/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clients
              </Button>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {viewingClient.name}
                </h1>
                <p className="text-gray-600">
                  {viewingClient.description || "No description provided"}
                </p>
              </div>
            </div>

            <Button 
              onClick={() => {
                console.log("Manage Projects clicked, viewingClient:", viewingClient);
                console.log("isAddProjectModalOpen before:", isAddProjectModalOpen);
                console.log("Available projects:", getAvailableProjects());
                console.log("Client projects:", getClientProjects(viewingClient.id));
                setIsAddProjectModalOpen(true);
                console.log("Setting modal to true, should open now");
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Manage Projects
            </Button>
          </div>

          {/* Projects Grid */}
          {clientProjects.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600 mb-4">Create the first project for {viewingClient.name}</p>
                <Button
                  onClick={() => setIsCreateProjectModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {clientProjects.map((project: any) => {
                const progress = getProjectProgress(project.id);
                const taskCounts = getProjectTaskCounts(project.id);
                
                return (
                  <Card
                    key={project.id}
                    className="group bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                          <Link href={`/projects/${project.id}`}>
                            {project.name}
                          </Link>
                        </CardTitle>
                        
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="secondary" 
                            className={`${
                              project.color === "blue" ? "bg-blue-100 text-blue-800" :
                              project.color === "green" ? "bg-green-100 text-green-800" :
                              project.color === "purple" ? "bg-purple-100 text-purple-800" :
                              project.color === "red" ? "bg-red-100 text-red-800" :
                              "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {project.color}
                          </Badge>

                        </div>
                      </div>
                      
                      {project.description && (
                        <CardDescription className="text-sm text-gray-600">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xl font-bold text-gray-600">{taskCounts.open}</div>
                            <div className="text-xs text-gray-500">Open</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-yellow-600">{taskCounts.inProgress}</div>
                            <div className="text-xs text-gray-500">In Progress</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-green-600">{taskCounts.closed}</div>
                            <div className="text-xs text-gray-500">Closed</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(project.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Layers className="w-4 h-4 mr-1" />
                            {taskCounts.total} tasks
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Manage Projects Modal */}
        <Dialog open={isAddProjectModalOpen} onOpenChange={(open) => {
          console.log("Modal onOpenChange called with:", open);
          setIsAddProjectModalOpen(open);
        }}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Projects for {viewingClient?.name}</DialogTitle>
              <DialogDescription>
                Assign or unassign projects from this client.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Current Projects */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Current Projects</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getClientProjects(viewingClient?.id || 0).length === 0 ? (
                    <p className="text-gray-500 italic">No projects assigned to this client yet.</p>
                  ) : (
                    getClientProjects(viewingClient?.id || 0).map((project: any) => (
                      <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-gray-600">{project.description}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Unassign button clicked for project:", project);
                            handleUnassignProject(project);
                          }}
                          className="text-orange-600 hover:text-orange-700"
                          title="Unassign project from client (project and tasks will remain)"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Available Projects */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Available Projects to Assign</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getAvailableProjects().length === 0 ? (
                    <p className="text-gray-500 italic">All projects are already assigned to clients.</p>
                  ) : (
                    getAvailableProjects().map((project: any) => (
                      <div key={project.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Checkbox
                          checked={selectedProjectIds.includes(project.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProjectIds([...selectedProjectIds, project.id]);
                            } else {
                              setSelectedProjectIds(selectedProjectIds.filter(id => id !== project.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-gray-600">{project.description}</p>
                          <p className="text-xs text-blue-600">
                            {project.clientId ? `Currently assigned to client ID: ${project.clientId}` : 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Create New Project Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    setIsAddProjectModalOpen(false);
                    setIsCreateProjectModalOpen(true);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Project for this Client
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddProjectModalOpen(false);
                  setSelectedProjectIds([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignProjects}
                disabled={selectedProjectIds.length === 0}
              >
                Assign Selected Projects
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Project Modal */}
        <Dialog open={isCreateProjectModalOpen} onOpenChange={setIsCreateProjectModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project for {viewingClient?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Enter project description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="project-color">Color</Label>
                <Select value={newProject.color} onValueChange={(value) => setNewProject({ ...newProject, color: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateProjectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim() || createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-100 to-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          title="Clients" 
          subtitle={`${(clients as Client[]).length} Active Clients`}
          action={
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Client</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="client-name">Client Name</Label>
                    <Input
                      id="client-name"
                      placeholder="Enter client name"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-description">Description</Label>
                    <Textarea
                      id="client-description"
                      placeholder="Enter client description"
                      value={newClient.description}
                      onChange={(e) => setNewClient({ ...newClient, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateClient}
                    disabled={!newClient.name.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Client"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        <div className="flex flex-col flex-1">
          <main className="flex-1 overflow-auto p-6">
            {(clients as Client[]).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Building className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
                <p className="text-sm text-gray-500 mb-4">Create your first client to get started with project management.</p>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Client
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(clients as Client[]).map((client: Client) => (
                  <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewingClient(client)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {getProjectCount(client.id)} projects
                        </Badge>
                      </div>
                      
                      {client.description && (
                        <p className="text-sm text-muted-foreground">{client.description}</p>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{getProjectCount(client.id)}</div>
                            <div className="text-xs text-muted-foreground">Projects</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{getClientTaskCounts(client.id)}</div>
                            <div className="text-xs text-muted-foreground">Tasks</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(client.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(client);
                              }}
                              className="h-8 w-8 p-0 hover:bg-blue-100"
                            >
                              <Pencil className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClient(client);
                              }}
                              className="h-8 w-8 p-0 hover:bg-red-100"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Edit Client Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-client-name">Client Name</Label>
                <Input
                  id="edit-client-name"
                  placeholder="Enter client name"
                  value={editClient.name}
                  onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-client-description">Description</Label>
                <Textarea
                  id="edit-client-description"
                  placeholder="Enter client description"
                  value={editClient.description}
                  onChange={(e) => setEditClient({ ...editClient, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditClient}
                disabled={!editClient.name.trim() || updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Client"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



        {/* Create New Project Modal */}
        <Dialog open={isCreateProjectModalOpen} onOpenChange={setIsCreateProjectModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project{viewingClient?.name ? ` for ${viewingClient?.name}` : ''}</DialogTitle>
              <DialogDescription>
                Create a new project and assign it to this client.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Enter project description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="project-color">Color</Label>
                <Select value={newProject.color} onValueChange={(value) => setNewProject({ ...newProject, color: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateProjectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim() || createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
      

    </div>
  );
}