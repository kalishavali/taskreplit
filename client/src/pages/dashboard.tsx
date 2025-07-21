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
          {/* Stats Dashboard Section */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="glass border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {stats?.totalTasks || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {stats?.totalProjects || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FolderOpen className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {stats?.inProgressTasks || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Timer className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                        {stats?.activeTeamMembers || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* View Toggle and Filters */}
            <div className="glass rounded-2xl border-0 shadow-xl p-6 mb-6 animate-slide-right">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 glass rounded-xl p-1 shadow-lg">
                  <Button
                    variant={viewMode === "kanban" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("kanban")}
                    className={`px-4 py-2 transition-all duration-300 hover-lift ${
                      viewMode === "kanban" 
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg" 
                        : "hover:bg-white/50"
                    }`}
                  >
                    <Columns className="w-4 h-4 mr-2" />
                    Kanban
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={`px-4 py-2 transition-all duration-300 hover-lift ${
                      viewMode === "list" 
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg" 
                        : "hover:bg-white/50"
                    }`}
                  >
                    <List className="w-4 h-4 mr-2" />
                    List
                  </Button>
                </div>
              
                {/* Filters */}
                <div className="flex items-center space-x-3">
                  <Select value={selectedProject} onValueChange={handleProjectFilter}>
                    <SelectTrigger className="w-40 glass border-0 shadow-md hover:shadow-lg transition-all duration-300">
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
                    <SelectTrigger className="w-32 glass border-0 shadow-md hover:shadow-lg transition-all duration-300">
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
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFilters} 
                    className="glass border-0 shadow-md hover:shadow-lg transition-all duration-300 hover-lift"
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            {viewMode === "kanban" ? (
              <div className="glass rounded-2xl p-6 shadow-xl animate-fade-scale">
                <ModernKanbanBoard />
              </div>
            ) : (
              <div className="glass rounded-2xl shadow-xl animate-fade-scale">
                <TaskListView tasks={filteredTasks} projects={projects} isLoading={tasksLoading} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}