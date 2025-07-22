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
import TimelineView from "@/components/timeline-view";
import { ProjectEditModal } from "@/components/project-edit-modal";
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  DollarSign,
  Settings,
  Plus,

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
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [projectEditModalOpen, setProjectEditModalOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Project not found");
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: allApplications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: projectApplications = [] } = useQuery<{applicationId: number}[]>({
    queryKey: ["/api/projects", projectId, "applications"],
    enabled: !!projectId,
  });

  // Get only applications configured for this project
  const applications = allApplications.filter(app => 
    projectApplications.some(pa => pa.applicationId === app.id)
  );

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

  // Get unique assignees for filter dropdown
  const uniqueAssignees = [...new Set(allTasks.map(task => task.assignee).filter(Boolean))];

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
    if (selectedAssignee !== "all" && task.assignee !== selectedAssignee) {
      return false;
    }
    if (selectedApplication && task.applicationId !== selectedApplication) {
      return false;
    }
    return true;
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedPriority("all");
    setSelectedAssignee("all");
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
  };

  const completionPercentage = projectStats.totalTasks > 0 
    ? Math.round((projectStats.completedTasks / projectStats.totalTasks) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-100 to-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="glass border-b sticky top-0 z-50 animate-slide-right">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="gap-2 hover-lift transition-all duration-300 hover:bg-white/20">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">My Projects</span>
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setProjectEditModalOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
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
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{project.teamMembers?.length || 0} members:</span>
                  <div className="flex items-center gap-1">
                    {project.teamMembers?.slice(0, 4).map((member, index) => (
                      <div key={index} className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium text-purple-700">
                        {member.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                    ))}
                    {(project.teamMembers?.length || 0) > 4 && (
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                        +{(project.teamMembers?.length || 0) - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <Badge className={cn("px-3 py-1", getStatusColor(project.status))}>
                {project.status}
              </Badge>
            </div>
          </div>

          {/* Project stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 animate-slide-up" style={{animationDelay: '0ms'}}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg animate-float">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Tasks</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{projectStats.totalTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-100 animate-slide-up" style={{animationDelay: '100ms'}}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg animate-float" style={{animationDelay: '0.5s'}}>
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Completed</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{completionPercentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-100 animate-slide-up" style={{animationDelay: '200ms'}}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg animate-float" style={{animationDelay: '1s'}}>
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-700">Assignees</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{project.assignees?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 animate-slide-up" style={{animationDelay: '300ms'}}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg animate-float" style={{animationDelay: '1.5s'}}>
                    <Layers className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700">Applications</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">{applications.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

          {/* Applications Filter */}
          {applications.length > 0 && (
            <div className="mb-8 animate-slide-up" style={{animationDelay: '400ms'}}>
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Applications</h3>
                <Button size="sm" variant="outline" className="gap-2 hover-lift transition-all duration-300 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:shadow-lg">
                  <Plus className="h-4 w-4" />
                  Add Application
                </Button>
              </div>
            
            <div className="flex items-center gap-3 flex-wrap animate-fade-scale">
              <Button
                size="sm"
                variant={selectedApplication === null ? "default" : "outline"}
                onClick={() => setSelectedApplication(null)}
                className="transition-all duration-300 hover-lift hover:shadow-lg group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Layers className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10">All Applications</span>
              </Button>
              {applications.map((app, index) => (
                <Button
                  key={app.id}
                  size="sm"
                  variant={selectedApplication === app.id ? "default" : "outline"}
                  onClick={() => setSelectedApplication(app.id)}
                  className="gap-2 transition-all duration-300 hover-lift hover:shadow-lg group relative overflow-hidden"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div 
                    className="w-3 h-3 rounded-full relative z-10 animate-pulse-glow" 
                    style={{ backgroundColor: app.color || '#10b981' }}
                  />
                  <span className="relative z-10 font-medium">{app.name}</span>
                </Button>
              ))}
            </div>
            </div>
          )}

          {/* Main Content */}
          <Tabs defaultValue="kanban" className="space-y-8">
            <div className="flex items-center justify-between animate-fade-scale" style={{animationDelay: '500ms'}}>
              <TabsList className="grid w-fit grid-cols-4 bg-white/60 backdrop-blur-sm border-0 shadow-lg p-1">
                <TabsTrigger value="kanban" className="relative overflow-hidden transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white font-medium">
                  <span className="relative z-10">Kanban</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="relative overflow-hidden transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white font-medium">
                  <span className="relative z-10">Table</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="relative overflow-hidden transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white font-medium">
                  <span className="relative z-10">List</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="relative overflow-hidden transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white font-medium">
                  <span className="relative z-10">Timeline</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="kanban" className="space-y-6 animate-fade-scale">
              <div className="glass rounded-xl p-1 shadow-lg">
                <ModernKanbanBoard 
                  projectId={projectId!} 
                  applicationId={selectedApplication || undefined} 
                />
              </div>
            </TabsContent>

            <TabsContent value="table" className="animate-fade-scale">
              <div className="glass rounded-xl shadow-lg border-0">
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

                    <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Assignees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Assignees</SelectItem>
                        {uniqueAssignees.map((assignee) => (
                          <SelectItem key={assignee} value={assignee}>
                            {assignee}
                          </SelectItem>
                        ))}
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

            <TabsContent value="list" className="animate-fade-scale">
              <div className="glass rounded-xl shadow-lg p-6">
                {/* List View Filters */}
                <div className="mb-6 flex items-center gap-4 flex-wrap">
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
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="InProgress">In Progress</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
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

                  <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Assignees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      {uniqueAssignees.map((assignee) => (
                        <SelectItem key={assignee} value={assignee}>
                          {assignee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
                
                <TaskListView 
                  tasks={tasks} 
                  projects={[project]} 
                />
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="animate-fade-scale">
              <div className="glass rounded-xl shadow-lg p-6">
                <TimelineView 
                  tasks={tasks} 
                  projects={[project]} 
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Project Edit Modal */}
      <ProjectEditModal
        project={project}
        open={projectEditModalOpen}
        onOpenChange={setProjectEditModalOpen}
      />
    </div>
  );
}