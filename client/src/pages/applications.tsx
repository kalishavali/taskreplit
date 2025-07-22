import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Smartphone, Globe, Watch, Edit, Trash2, ArrowLeft, Settings, FolderOpen, Minus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertApplicationSchema, type Application, type Project } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";


export default function Applications() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null);
  const [isManageProjectsModalOpen, setIsManageProjectsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      type: "Web",
      color: "#3b82f6",
      status: "active",
    },
  });

  // Reset form when editing application changes
  useEffect(() => {
    if (editingApplication) {
      form.reset({
        name: editingApplication.name,
        description: editingApplication.description || "",
        icon: editingApplication.icon || "",
        type: editingApplication.type,
        color: editingApplication.color || "#3b82f6",
        status: editingApplication.status || "active",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        icon: "",
        type: "Web",
        color: "#3b82f6",
        status: "active",
      });
    }
  }, [editingApplication, form]);

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Query for project-application relationships for the viewing application
  const { data: applicationProjects = [] } = useQuery<Project[]>({
    queryKey: ['/api/applications', viewingApplication?.id, 'projects'],
    enabled: !!viewingApplication,
  });

  // Helper functions for project-application relationships
  const getApplicationProjects = (applicationId: number) => {
    if (!applicationId || !applicationProjects) return [];
    return applicationProjects;
  };

  const getAvailableProjects = () => {
    if (!viewingApplication || !applicationProjects) return projects as Project[];
    const assignedProjectIds = applicationProjects.map((p: Project) => p.id);
    return (projects as Project[]).filter((project: Project) => {
      return !assignedProjectIds.includes(project.id);
    });
  };

  const createApplication = useMutation({
    mutationFn: async (data: any) => {
      const url = editingApplication ? `/api/applications/${editingApplication.id}` : "/api/applications";
      const method = editingApplication ? "PUT" : "POST";
      
      return await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      setIsCreateDialogOpen(false);
      setEditingApplication(null);
      form.reset();
      toast({
        title: editingApplication ? "Application updated successfully" : "Application created successfully",
      });
    },
    onError: () => {
      toast({
        title: editingApplication ? "Failed to update application" : "Failed to create application",
        variant: "destructive",
      });
    },
  });

  const deleteApplication = useMutation({
    mutationFn: async (id: number) => {
      return await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      toast({
        title: "Application deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete application",
        variant: "destructive",
      });
    },
  });

  const assignProjectMutation = useMutation({
    mutationFn: async ({ projectId, applicationId }: { projectId: number; applicationId: number }) => {
      return await apiRequest(`/api/projects/${projectId}/applications/${applicationId}`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project assigned successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to assign project",
        variant: "destructive",
      });
    },
  });

  const unassignProjectMutation = useMutation({
    mutationFn: async ({ projectId, applicationId }: { projectId: number; applicationId: number }) => {
      return await apiRequest(`/api/projects/${projectId}/applications/${applicationId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project unassigned successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to unassign project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createApplication.mutate(data);
  };

  const handleEdit = (app: Application) => {
    setEditingApplication(app);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this application?")) {
      deleteApplication.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    console.log("Dialog onOpenChange called with:", open);
    setIsCreateDialogOpen(open);
    if (!open) {
      setEditingApplication(null);
      form.reset();
    }
  };

  const handleAssignProject = (projectId: number) => {
    if (!viewingApplication) return;
    assignProjectMutation.mutate({
      projectId,
      applicationId: viewingApplication.id
    });
  };

  const handleUnassignProject = (project: Project) => {
    if (!viewingApplication) return;
    unassignProjectMutation.mutate({
      projectId: project.id,
      applicationId: viewingApplication.id
    });
  };

  const filteredApplications = applications.filter((app: Application) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Mobile":
        return <Smartphone className="w-4 h-4" />;
      case "Web":
        return <Globe className="w-4 h-4" />;
      case "Watch":
        return <Watch className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Mobile":
        return "bg-green-100 text-green-800";
      case "Web":
        return "bg-blue-100 text-blue-800";
      case "Watch":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading applications...</div>
          </div>
        </div>
      </div>
    );
  }

  // If viewing a specific application, show application details with projects
  if (viewingApplication) {
    const applicationProjects = getApplicationProjects(viewingApplication.id);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Application Details Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setViewingApplication(null)}
                className="hover:bg-white/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Applications
              </Button>
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{viewingApplication.icon}</div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {viewingApplication.name}
                  </h1>
                  <p className="text-gray-600">
                    {viewingApplication.description || "No description provided"}
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setIsManageProjectsModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Manage Projects
            </Button>
          </div>

          {/* Projects Grid */}
          {applicationProjects.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600 mb-4">Assign projects to {viewingApplication.name}</p>
                <Button 
                  onClick={() => setIsManageProjectsModalOpen(true)}
                  variant="outline"
                  className="bg-white/50 hover:bg-white/80"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Projects
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applicationProjects.map((project: Project) => (
                <Card key={project.id} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-8 rounded-full"
                          style={{ backgroundColor: project.color || "#3b82f6" }}
                        />
                        <div>
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <p className="text-sm text-gray-600">{project.description}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-white/50">
                        {project.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnassignProject(project)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Manage Projects Modal */}
          <Dialog open={isManageProjectsModalOpen} onOpenChange={setIsManageProjectsModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Manage Projects for {viewingApplication?.name}</DialogTitle>
                <DialogDescription>
                  Assign or unassign projects to this application.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Assigned Projects */}
                <div>
                  <h3 className="font-medium mb-3">Assigned Projects</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {getApplicationProjects(viewingApplication?.id || 0).map((project: Project) => (
                      <div key={project.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color || "#3b82f6" }}
                          />
                          <span className="text-sm">{project.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassignProject(project)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {getApplicationProjects(viewingApplication?.id || 0).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No projects assigned</p>
                    )}
                  </div>
                </div>

                {/* Available Projects */}
                <div>
                  <h3 className="font-medium mb-3">Available Projects</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {getAvailableProjects().map((project: Project) => (
                      <div key={project.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color || "#3b82f6" }}
                          />
                          <span className="text-sm">{project.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAssignProject(project.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {getAvailableProjects().length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No available projects</p>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              Applications
            </h1>
            <p className="text-gray-600">Manage your applications and services</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  console.log("New Application button clicked");
                  console.log("Current dialog state:", isCreateDialogOpen);
                  setIsCreateDialogOpen(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Application
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingApplication ? "Edit Application" : "Create New Application"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Application name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Application description" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (Emoji)</FormLabel>
                        <FormControl>
                          <Input placeholder="📱" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select application type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Web">Web Application</SelectItem>
                            <SelectItem value="Mobile">Mobile Application</SelectItem>
                            <SelectItem value="Watch">Watch Application</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => handleDialogClose(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createApplication.isPending}>
                      {createApplication.isPending 
                        ? (editingApplication ? "Updating..." : "Creating...") 
                        : (editingApplication ? "Update Application" : "Create Application")
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map((app: Application) => (
            <Card 
              key={app.id} 
              className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift cursor-pointer"
              onClick={() => setViewingApplication(app)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{app.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <p className="text-sm text-gray-600">{app.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Badge className={getTypeColor(app.type)}>
                    {getTypeIcon(app.type)}
                    <span className="ml-1">{app.type}</span>
                  </Badge>
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: app.color || "#3b82f6" }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {getApplicationProjects(app.id).length} projects
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(app);
                      }}
                      className="bg-white/50 hover:bg-white/80"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(app.id);
                      }}
                      className="text-red-600 hover:text-red-700 bg-white/50 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchQuery ? "No applications found matching your search." : "No applications yet."}
            </div>
            {!searchQuery && (
              <Button 
                onClick={() => {
                  console.log("Empty state button clicked");
                  setEditingApplication(null);
                  setIsCreateDialogOpen(true);
                }}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create your first application
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}