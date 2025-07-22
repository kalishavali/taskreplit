import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import TaskListView from "@/components/task-list-view";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Plus } from "lucide-react";
import { TaskCreateModal } from "@/components/task-modal/task-create-modal";
import type { Task, Project } from "@shared/schema";

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
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



  // Apply filters to both search results and regular tasks
  const applyFilters = (taskList: Task[]) => {
    return taskList.filter(task => {
      // Filter by client first (affects which projects are available)
      if (selectedClient !== "all") {
        const project = projects.find(p => p.id === task.projectId);
        if (!project || project.clientId !== parseInt(selectedClient)) {
          return false;
        }
      }
      if (selectedProject !== "all" && task.projectId !== parseInt(selectedProject)) {
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
      return true;
    });
  };

  // Filter tasks based on search and filters
  const filteredTasks = searchQuery.trim() 
    ? applyFilters(searchResults)
    : applyFilters(tasks);

  // Filter projects based on selected client
  const availableProjects = selectedClient === "all" 
    ? []  // No projects shown until client is selected
    : projects.filter(project => project.clientId === parseInt(selectedClient));

  // Get assignees based on selected project's tasks only
  const availableAssignees = selectedProject === "all" || selectedClient === "all"
    ? [] // No assignees shown until both client and project are selected
    : Array.from(new Set(
        tasks
          .filter(task => task.projectId === parseInt(selectedProject))
          .map(task => task.assignee)
          .filter(Boolean)
      ));

  // Reset dependent filters when parent changes
  const handleClientChange = (value: string) => {
    setSelectedClient(value);
    setSelectedProject("all"); // Reset project when client changes
    setSelectedAssignee("all"); // Reset assignee when client changes
  };

  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    setSelectedAssignee("all"); // Reset assignee when project changes
  };

  return (
    <>
      <Header 
        title="My Tasks" 
        subtitle={`${filteredTasks.length} tasks found`}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        action={
          <Button onClick={() => setIsTaskModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        }
      />
      
      <main className="flex-1 overflow-auto">
        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <Select value={selectedClient} onValueChange={handleClientChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProject} onValueChange={handleProjectChange} disabled={selectedClient === "all"}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={selectedClient === "all" ? "Select Client First" : "All Projects"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {availableProjects.map((project) => (
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
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="InProgress">In Progress</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee} disabled={selectedProject === "all" || selectedClient === "all"}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={
                  selectedClient === "all" ? "Select Client First" :
                  selectedProject === "all" ? "Select Project First" :
                  "All Assignees"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {availableAssignees.map((assignee) => (
                  <SelectItem key={assignee} value={assignee!}>
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(selectedClient !== "all" || selectedProject !== "all" || selectedStatus !== "all" || selectedPriority !== "all" || selectedAssignee !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedClient("all");
                  setSelectedProject("all");
                  setSelectedStatus("all");
                  setSelectedPriority("all");
                  setSelectedAssignee("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Task List */}
        <div className="p-6 h-full overflow-auto">
          <TaskListView tasks={filteredTasks} projects={projects} isLoading={tasksLoading} />
        </div>
      </main>

      <TaskCreateModal 
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
      />
    </>
  );
}
