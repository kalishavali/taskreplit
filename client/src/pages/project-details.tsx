import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ModernKanbanBoard } from "@/components/modern-kanban/modern-kanban-board";
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  DollarSign,
  Settings,
  Plus,
  MoreHorizontal,
  Layers,
  Target,
  Clock,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, Application, Task } from "@shared/schema";

export default function ProjectDetails() {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id) : null;
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Project not found");
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/applications?projectId=${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks", projectId, selectedApplication],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId.toString());
      if (selectedApplication) params.append('applicationId', selectedApplication.toString());
      
      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    enabled: !!projectId,
  });

  if (projectLoading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const projectStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    inProgressTasks: tasks.filter(t => t.status === 'inprogress').length,
    todoTasks: tasks.filter(t => t.status === 'todo').length,
    totalTimeLogged: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
    estimatedTime: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
  };

  const completionPercentage = projectStats.totalTasks > 0 
    ? Math.round((projectStats.completedTasks / projectStats.totalTasks) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm text-gray-600">My Projects</span>
                </Button>
              </Link>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-gray-900">{project.name}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {project.teamMembers?.slice(0, 3).map((member, index) => (
                <div key={index} className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium text-purple-700">
                  {member.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
              ))}
              {(project.teamMembers?.length || 0) > 3 && (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                  +{(project.teamMembers?.length || 0) - 3}
                </div>
              )}
              <Button size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                Invite
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {project.name}
              </h1>
              <p className="text-gray-600 text-lg mb-4">
                {project.description}
              </p>
              
              {/* Project metadata */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'No start date'} - 
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No end date'}
                  </span>
                </div>
                {project.budget && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>${project.budget.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{project.teamMembers?.length || 0} members</span>
                </div>
              </div>
            </div>

            {/* Status and actions */}
            <div className="flex items-center gap-3">
              <Badge className={cn("px-3 py-1", getStatusColor(project.status))}>
                {project.status}
              </Badge>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Project stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{projectStats.totalTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{completionPercentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time Logged</p>
                    <p className="text-2xl font-bold text-gray-900">{projectStats.totalTimeLogged}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Layers className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Applications Filter */}
        {applications.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Application
              </Button>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant={selectedApplication === null ? "default" : "outline"}
                onClick={() => setSelectedApplication(null)}
              >
                All Applications
              </Button>
              {applications.map((app) => (
                <Button
                  key={app.id}
                  size="sm"
                  variant={selectedApplication === app.id ? "default" : "outline"}
                  onClick={() => setSelectedApplication(app.id)}
                  className="gap-2"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: app.color || '#10b981' }}
                  />
                  {app.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="kanban" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-4">
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="kanban" className="space-y-6">
            <ModernKanbanBoard 
              projectId={projectId!} 
              applicationId={selectedApplication} 
            />
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500">Table view coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500">List view coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500">Timeline view coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}