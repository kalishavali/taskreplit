import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModernKanbanBoard } from "@/components/modern-kanban/modern-kanban-board";
import TaskListView from "@/components/task-list-view";
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
  CheckCircle,
  Search,
  Filter,
  Grid3X3,
  List,
  Activity,
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, Application, Task } from "@shared/schema";

export default function ProjectDetails() {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id) : null;
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "list" | "timeline">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

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

  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks", projectId, selectedApplication],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId.toString());
      if (selectedApplication) params.append('applicationId', selectedApplication.toString());
      
      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const result = await response.json();
      return Array.isArray(result) ? result : [];
    },
    enabled: !!projectId,
  });

  // Filter tasks based on search and filters
  const tasks = allTasks.filter(task => {
    if (searchQuery.trim() && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedStatus !== "all" && task.status !== selectedStatus) {
      return false;
    }
    if (selectedPriority !== "all" && task.priority !== selectedPriority) {
      return false;
    }
    return true;
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedPriority("all");
    setSelectedApplication(null);
  };

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
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <Input 
                    defaultValue={project.name}
                    className="text-3xl font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                    onBlur={(e) => {
                      setIsEditingName(false);
                      // TODO: Update project name via API
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingName(false);
                      }
                    }}
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setIsEditingName(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {isEditingDescription ? (
                <div className="flex items-center gap-2">
                  <Input 
                    defaultValue={project.description || ""}
                    className="text-gray-600 bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                    placeholder="Add project description..."
                    onBlur={(e) => {
                      setIsEditingDescription(false);
                      // TODO: Update project description via API
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingDescription(false);
                      }
                    }}
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingDescription(false)}>
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <p className="text-gray-600">{project.description || "No description"}</p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setIsEditingDescription(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
              
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
              applicationId={selectedApplication || undefined} 
            />
          </TabsContent>

          <TabsContent value="table">
            <div className="bg-white rounded-lg border">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="todo">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="done">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                      <Filter className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Task</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Priority</th>
                        <th className="text-left py-3 px-4 font-medium">Assignee</th>
                        <th className="text-left py-3 px-4 font-medium">Due Date</th>
                        <th className="text-left py-3 px-4 font-medium">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.id} className="border-b hover:bg-gray-50 cursor-pointer">
                          <td className="py-3 px-4 font-medium">{task.title}</td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary" className="capitalize">{task.status}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="capitalize">{task.priority}</Badge>
                          </td>
                          <td className="py-3 px-4">{task.assignee || "Unassigned"}</td>
                          <td className="py-3 px-4">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${task.progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{task.progress || 0}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No tasks found matching your filters</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list">
            <TaskListView 
              tasks={tasks} 
              projects={[project]} 
            />
          </TabsContent>

          <TabsContent value="timeline">
            <div className="bg-white rounded-lg border p-6">
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-medium mb-2">Timeline View</p>
                <p>Timeline view coming soon with Gantt chart functionality</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}