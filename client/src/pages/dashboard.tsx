import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import KanbanBoard from "@/components/kanban/kanban-board";
import TaskListView from "@/components/task-list-view";
import StatsDashboard from "@/components/stats-dashboard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, Columns, List } from "lucide-react";
import type { Task, Project } from "@shared/schema";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
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
              <Select value={selectedProject} onValueChange={setSelectedProject}>
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
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="inprogress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-1" />
                More Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === "kanban" ? (
          <KanbanBoard tasks={filteredTasks} projects={projects} isLoading={tasksLoading} />
        ) : (
          <TaskListView tasks={filteredTasks} projects={projects} isLoading={tasksLoading} />
        )}

        {/* Stats Dashboard */}
        <StatsDashboard />
      </main>
    </>
  );
}
