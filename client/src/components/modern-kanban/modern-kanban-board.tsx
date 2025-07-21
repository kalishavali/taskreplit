import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { TaskEditModal } from "@/components/task-modal/task-edit-modal";
import { TaskCreateModal } from "@/components/task-modal/task-create-modal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Clock,
  MessageCircle,
  Users,
  Calendar,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Task, Project, Application } from "@shared/schema";

interface ModernKanbanBoardProps {
  projectId?: number;
  applicationId?: number;
}

const statusColumns = [
  {
    id: "Open",
    title: "Open", 
    color: "bg-gray-50 border-gray-200",
    headerColor: "text-gray-700",
    taskColor: "border-l-gray-400"
  },
  {
    id: "InProgress", 
    title: "In Progress",
    color: "bg-orange-50 border-orange-200",
    headerColor: "text-orange-700",
    taskColor: "border-l-orange-400"
  },
  {
    id: "Blocked",
    title: "Blocked", 
    color: "bg-red-50 border-red-200",
    headerColor: "text-red-700",
    taskColor: "border-l-red-400"
  },
  {
    id: "Closed",
    title: "Closed",
    color: "bg-green-50 border-green-200", 
    headerColor: "text-green-700",
    taskColor: "border-l-green-400"
  }
];

const priorityConfig = {
  low: { color: "bg-green-100 text-green-700", label: "Low" },
  medium: { color: "bg-yellow-100 text-yellow-700", label: "Medium" },
  high: { color: "bg-red-100 text-red-700", label: "High" },
  urgent: { color: "bg-purple-100 text-purple-700", label: "Urgent" }
};

function TaskCard({ task, index, onTaskClick }: { task: Task; index: number; onTaskClick: (task: Task) => void }) {
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "mb-3 cursor-pointer hover:shadow-md transition-all duration-200 border-l-4",
            statusColumns.find(col => col.id === task.status)?.taskColor,
            snapshot.isDragging ? "shadow-lg rotate-2" : ""
          )}
          onClick={() => onTaskClick(task)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {task.description}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-60 hover:opacity-100">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Priority and Status */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className={cn("text-xs px-2 py-0.5", priority.color)}>
                {priority.label}
              </Badge>
              {task.progress && task.progress > 0 && (
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-1" />
                </div>
              )}
            </div>

            {/* Task metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                {task.estimatedHours && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{task.estimatedHours}h</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>0</span>
                </div>
                <div className="flex items-center gap-1">
                  <Archive className="h-3 w-3" />
                  <span>{task.progress || 0}/{task.estimatedHours || 0}</span>
                </div>
              </div>

              {/* Assignee avatar */}
              {task.assignee && (
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                    {getInitials(task.assignee)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Due date */}
            {task.dueDate && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}

function KanbanColumn({ 
  column, 
  tasks, 
  onAddTask,
  onTaskClick 
}: { 
  column: typeof statusColumns[0]; 
  tasks: Task[]; 
  onAddTask: (status: string) => void;
  onTaskClick: (task: Task) => void;
}) {
  return (
    <div className="flex-1 min-w-72">
      <div className={cn("rounded-lg border-2 border-dashed min-h-[600px]", column.color)}>
        {/* Column Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className={cn("font-semibold", column.headerColor)}>
                {column.title}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {tasks.length}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => onAddTask(column.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tasks Container */}
        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "p-4 min-h-[500px] transition-colors",
                snapshot.isDraggingOver ? "bg-blue-50/50" : ""
              )}
            >
              {tasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} onTaskClick={onTaskClick} />
              ))}
              {provided.placeholder}
              
              {/* Add task button */}
              {tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                  <Plus className="h-8 w-8 mb-2" />
                  <span className="text-sm">No tasks yet</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => onAddTask(column.id)}
                  >
                    Add Task
                  </Button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}

export function ModernKanbanBoard({ projectId, applicationId }: ModernKanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<number | null>(projectId || null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<string>("todo");
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", selectedProject, applicationId],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"]
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications", selectedProject],
    enabled: !!selectedProject
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      return await apiRequest(`/api/tasks/${taskId}`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const taskId = parseInt(result.draggableId);
    const newStatus = result.destination.droppableId;

    updateTaskMutation.mutate({ taskId, status: newStatus });
  };

  const handleAddTask = (status: string) => {
    setCreateTaskStatus(status);
    setCreateTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const filteredTasks = searchQuery 
    ? tasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Invite
          </Button>
          <Button size="sm" onClick={() => handleAddTask("todo")}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 pb-6 min-w-fit">
            {statusColumns.map((column) => {
              const columnTasks = filteredTasks.filter(task => task.status === column.id);
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  onAddTask={handleAddTask}
                  onTaskClick={handleTaskClick}
                />
              );
            })}
          </div>
        </DragDropContext>
      </div>

      <TaskEditModal
        task={selectedTask}
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        projectId={selectedProject || undefined}
        applicationId={applicationId}
      />

      <TaskCreateModal
        open={createTaskModalOpen}
        onOpenChange={setCreateTaskModalOpen}
        projectId={selectedProject || undefined}
        applicationId={applicationId}
        initialStatus={createTaskStatus}
      />
    </div>
  );
}