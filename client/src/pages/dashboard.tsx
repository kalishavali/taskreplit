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
import { Search, Filter, Columns, List, Users, Clock, Bell, TrendingUp, CheckCircle, AlertTriangle, Timer } from "lucide-react";
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
    <>
      <Header 
        title="Dashboard" 
        subtitle={`${projects.length} Active Projects`}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <main className="flex-1 overflow-auto">
        {/* View Toggle and Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className="px-3 py-1.5"
              >
                <Columns className="w-4 h-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-3 py-1.5"
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
              
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === "kanban" ? (
          <div className="p-6">
            <ModernKanbanBoard />
          </div>
        ) : (
          <TaskListView tasks={filteredTasks} projects={projects} isLoading={tasksLoading} />
        )}

        {/* Enhanced Stats Dashboard */}
        <div className="p-6 space-y-6">
          {/* Enhanced Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Tasks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.doneTasks || 0} completed this week
                </p>
              </CardContent>
            </Card>

            {/* Time Logged */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Logged</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.floor((stats?.totalTimeLogged || 0) / 60)}h {(stats?.totalTimeLogged || 0) % 60}m
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {stats?.totalProjects || 0} projects
                </p>
              </CardContent>
            </Card>

            {/* Active Team Members */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeTeamMembers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active members
                </p>
              </CardContent>
            </Card>

            {/* Blocked Tasks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.unreadNotifications || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Unread notifications
                </p>
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
    </>
  );
}
