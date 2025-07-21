import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { ModernKanbanBoard } from "@/components/modern-kanban/modern-kanban-board";
import TaskListView from "@/components/task-list-view";
import StatsDashboard from "@/components/stats-dashboard";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { TimeTracker } from "@/components/time-tracking/time-tracker";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, Columns, List, Users, Clock, Bell, TrendingUp, CheckCircle, AlertTriangle, Timer, FolderOpen } from "lucide-react";
import type { Task, Project } from "@shared/schema";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Filter handlers
  const handleProjectFilter = (value: string) => {
    setSelectedProject(value);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
  };

  const clearFilters = () => {
    setSelectedProject("all");
    setSelectedStatus("all");
    setSearchQuery("");
  };

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalTasks: number;
    totalProjects: number;
    todoTasks: number;
    inProgressTasks: number;
    doneTasks: number;
    blockedTasks: number;
    totalTimeLogged: number;
    activeTeamMembers: number;
    unreadNotifications: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/team-members"],
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["/api/time-entries"],
  });

  const { data: searchResults = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/tasks/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Filter tasks based on search and filters
  const filteredTasks = searchQuery.trim() 
    ? searchResults 
    : tasks.filter(task => {
        if (selectedProject !== "all" && task.projectId !== parseInt(selectedProject)) {
          return false;
        }
        if (selectedStatus !== "all" && task.status !== selectedStatus) {
          return false;
        }
        return true;
      });

  // Handle filter changes with existing functions above

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden custom-scrollbar">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-100 to-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10">
        <Header 
          title="Dashboard" 
          subtitle={`${projects.length} Active Projects`}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        <main className="flex-1 overflow-auto custom-scrollbar">
          {/* View Toggle and Filters */}
          <div className="glass border-b px-6 py-4 animate-slide-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 glass rounded-xl p-1 shadow-lg">
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className="px-4 py-2 transition-all duration-300 data-[state=on]:bg-gradient-to-r data-[state=on]:from-blue-500 data-[state=on]:to-purple-500 hover-lift"
              >
                <Columns className="w-4 h-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-4 py-2 transition-all duration-300 data-[state=on]:bg-gradient-to-r data-[state=on]:from-emerald-500 data-[state=on]:to-teal-500 hover-lift"
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-3">
              <Select value={selectedProject} onValueChange={handleProjectFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-32">
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
              
              <Button variant="outline" size="sm" onClick={clearFilters} className="hover-lift transition-all duration-300 hover:shadow-lg">
                <Filter className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            </div>
            </div>
          </div>

          {/* Content Area */}
          {viewMode === "kanban" ? (
            <div className="p-6">
              <div className="glass rounded-xl p-1 shadow-lg animate-fade-scale">
                <ModernKanbanBoard />
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="glass rounded-xl shadow-lg animate-fade-scale">
                <TaskListView tasks={filteredTasks} projects={projects} isLoading={tasksLoading} />
              </div>
            </div>
          )}

          {/* Enhanced Stats Dashboard */}
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent animate-slide-up">Dashboard Overview</h2>
            
            {/* Enhanced Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-scale">
              {/* Total Tasks */}
              <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 animate-slide-up">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg animate-float">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Tasks</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats?.totalTasks || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            {/* Total Projects */}
            <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-100 animate-slide-up" style={{animationDelay: '100ms'}}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg animate-float" style={{animationDelay: '0.5s'}}>
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Total Projects</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stats?.totalProjects || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Team Members */}
            <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 animate-slide-up" style={{animationDelay: '200ms'}}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg animate-float" style={{animationDelay: '1.5s'}}>
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700">Team Members</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">{stats?.activeTeamMembers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-100 animate-slide-up" style={{animationDelay: '300ms'}}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg animate-float" style={{animationDelay: '2s'}}>
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-700">Notifications</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{stats?.unreadNotifications || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>

          {/* Progress Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Task Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Task Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Completed</span>
                    <span>{stats?.doneTasks || 0} / {stats?.totalTasks || 0}</span>
                  </div>
                  <Progress 
                    value={stats?.totalTasks ? (stats.doneTasks / stats.totalTasks) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>In Progress</span>
                    <span>{stats?.inProgressTasks || 0}</span>
                  </div>
                  <Progress 
                    value={stats?.totalTasks ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                {(stats?.blockedTasks || 0) > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-destructive">
                      <span>Blocked</span>
                      <span>{stats?.blockedTasks || 0}</span>
                    </div>
                    <Progress 
                      value={stats?.totalTasks ? ((stats?.blockedTasks || 0) / stats.totalTasks) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notifications</span>
                  <NotificationCenter />
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium">Recent Activity</span>
                  <div className="text-xs text-muted-foreground">
                    Latest project updates and team activities
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Tracking Widget */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <TimeTracker />
            </div>
            
            {/* Recent Tasks */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredTasks.slice(0, 5).map((task: any) => {
                      const project = projects.find((p: any) => p.id === task.projectId);
                      return (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium">{task.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {project?.name || 'No Project'}
                              </Badge>
                              <Badge 
                                variant={task.status === 'done' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {task.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              {task.assignee || 'Unassigned'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Original Stats Dashboard */}
          <StatsDashboard />
        </main>
      </div>
    </div>
  );
}
