import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FolderOpen, Calendar, Users, Upload, X, Sidebar, Layers, Filter } from "lucide-react";
import { ApplicationsPanel } from "@/components/applications-panel";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type Project, type Task, type Application, type Client } from "@shared/schema";
import type { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ProjectFormData = z.infer<typeof insertProjectSchema>;

export default function Projects() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [isApplicationsPanelOpen, setIsApplicationsPanelOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const { toast } = useToast();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  // Fetch project applications data for all projects
  const { data: allProjectApplications = {} } = useQuery({
    queryKey: ["/api/projects-applications", ...(projects || []).map(p => p.id)],
    queryFn: async () => {
      const projectApplicationsMap: {[key: number]: Application[]} = {};
      
      // Fetch applications for each project
      for (const project of projects || []) {
        try {
          const response = await fetch(`/api/projects/${project.id}/applications`);
          if (response.ok) {
            const applications = await response.json();
            projectApplicationsMap[project.id] = applications;
          } else {
            projectApplicationsMap[project.id] = [];
          }
        } catch (error) {
          projectApplicationsMap[project.id] = [];
        }
      }
      
      return projectApplicationsMap;
    },
    enabled: (projects || []).length > 0,
    staleTime: 0, // Always refetch to get latest data
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const response = await apiRequest("/api/projects", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "blue",
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      // Create the project first
      const projectResponse = await apiRequest("/api/projects", "POST", data);
      const project = await projectResponse.json();
      
      // Link selected applications to the project if any
      if (selectedApplications.length > 0) {
        await apiRequest(`/api/projects/${project.id}/applications`, "POST", {
          applicationIds: selectedApplications
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects-applications"] });
      setIsDialogOpen(false);
      setSelectedApplications([]);
      form.reset();
      toast({
        title: "Success",
        description: "Project created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project.",
        variant: "destructive",
      });
    }
  };

  const getProjectProgress = (projectId: number) => {
    const projectTasks = (allTasks || []).filter(task => task.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(task => task.status === "done").length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  const getProjectTaskCounts = (projectId: number) => {
    const projectTasks = (allTasks || []).filter(task => task.projectId === projectId);
    return {
      total: projectTasks.length,
      todo: projectTasks.filter(t => t.status === "todo").length,
      inProgress: projectTasks.filter(t => t.status === "inprogress").length,
      done: projectTasks.filter(t => t.status === "done").length,
    };
  };

  // Add function to get project application count
  const getProjectApplicationCount = (projectId: number) => {
    const projectApps = allProjectApplications[projectId] || [];
    return projectApps.length;
  };

  // Filter projects based on selected client
  const filteredProjects = selectedClient === "all" 
    ? projects 
    : projects.filter(project => project.clientId === parseInt(selectedClient));

  if (isLoading) {
    return (
      <>
        <Header title="Projects" subtitle="Manage your projects" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-100 to-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          title="Projects" 
          subtitle={`${projects.length} Active Projects`}
          action={
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsApplicationsPanelOpen(!isApplicationsPanelOpen)}
                className="border-gray-300 hover:bg-gray-50"
              >
                <Sidebar className="w-4 h-4 mr-2" />
                Apps
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name..." {...field} />
                        </FormControl>
                        <FormMessage />
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
                          <Textarea placeholder="Enter project description..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <FormControl>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                            <SelectContent>
                              {(clients as any[]).map((client: any) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                              <SelectItem value="orange">Orange</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Applications Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Related Applications</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                      {applications.length === 0 ? (
                        <p className="text-sm text-gray-500">No applications available</p>
                      ) : (
                        applications.map((app) => (
                          <div key={app.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`app-${app.id}`}
                              checked={selectedApplications.includes(app.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedApplications([...selectedApplications, app.id]);
                                } else {
                                  setSelectedApplications(selectedApplications.filter(id => id !== app.id));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`app-${app.id}`} className="flex items-center space-x-2 text-sm cursor-pointer">
                              <span className="text-lg">{app.icon}</span>
                              <span>{app.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {app.type}
                              </Badge>
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* Icon Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Icon</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        {iconFile ? (
                          <img 
                            src={URL.createObjectURL(iconFile)} 
                            alt="Project icon" 
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <Upload className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setIconFile(file);
                          }}
                          className="hidden"
                          id="icon-upload"
                        />
                        <label 
                          htmlFor="icon-upload"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Icon
                        </label>
                        {iconFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIconFile(null)}
                            className="ml-2"
                          >
                            <X className="w-4 h-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multiple Application Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Applications</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                      {applications.map((app) => (
                        <label key={app.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedApplications.includes(app.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedApplications([...selectedApplications, app.id]);
                              } else {
                                setSelectedApplications(selectedApplications.filter(id => id !== app.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{app.name}</span>
                        </label>
                      ))}
                      {applications.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">
                          No applications available
                        </p>
                      )}
                    </div>
                    {selectedApplications.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Selected: {selectedApplications.length} application{selectedApplications.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProjectMutation.isPending}>
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
            </div>
        }
      />
      
      <div className="flex flex-col flex-1">
        {/* Filters Section */}
        <div className="px-6 py-4 glass border-b border-gray-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-48 glass border-0 shadow-md hover:shadow-lg transition-all duration-300">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-white/50">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'Project' : 'Projects'}
              </Badge>
            </div>
          </div>
        </div>

        <main className={`flex-1 overflow-auto p-6 transition-all duration-300 ${isApplicationsPanelOpen ? 'mr-80' : ''}`}>
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FolderOpen className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-sm text-gray-500 mb-4">Create your first project to get started with task management.</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const progress = getProjectProgress(project.id);
              const taskCounts = getProjectTaskCounts(project.id);
              
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
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
                      
                      {/* Show client name */}
                      {project.clientId && (
                        <div className="mb-2">
                          <Badge variant="outline" className="text-xs">
                            {(clients as any[])?.find(c => c.id === project.clientId)?.name || 'Client'}
                          </Badge>
                        </div>
                      )}
                      
                      {project.description && (
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-gray-600">{taskCounts.todo}</div>
                            <div className="text-xs text-muted-foreground">To Do</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-yellow-600">{taskCounts.inProgress}</div>
                            <div className="text-xs text-muted-foreground">In Progress</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{taskCounts.done}</div>
                            <div className="text-xs text-muted-foreground">Done</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(project.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Layers className="w-4 h-4 mr-1" />
                            {getProjectApplicationCount(project.id)} applications
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          )}
        </main>
        
        {/* Applications Panel */}
        {isApplicationsPanelOpen && (
          <div className="fixed right-0 top-0 h-full z-50">
            <ApplicationsPanel
              projects={projects}
              selectedProjectIds={selectedProjectIds}
              onProjectSelectionChange={setSelectedProjectIds}
            />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
