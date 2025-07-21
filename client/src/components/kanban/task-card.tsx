import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, CheckCircle, Calendar, User } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import TaskModal from "@/components/modals/task-modal";
import { cn } from "@/lib/utils";
import type { Task, Project } from "@shared/schema";

interface TaskCardProps {
  task: Task;
  projects: Project[];
  isDragging?: boolean;
}

export default function TaskCard({ task, projects, isDragging }: TaskCardProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const project = projects.find(p => p.id === task.projectId);
  
  const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const projectColors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const avatarColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-orange-500",
  ];

  const getAvatarColor = (name: string) => {
    const index = name.length % avatarColors.length;
    return avatarColors[index];
  };

  return (
    <>
      <div className={cn(
        "bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-move",
        isDragging && "shadow-lg rotate-2 scale-105",
        task.status === "done" && "opacity-75"
      )}>
        <div className="flex items-start justify-between mb-2">
          {project && (
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs font-medium px-2 py-1 rounded",
                projectColors[project.color as keyof typeof projectColors] || projectColors.blue
              )}
            >
              {project.name}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsTaskModalOpen(true)}>
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{task.title}</h4>
        
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
        )}
        
        {task.status === "inprogress" && task.progress !== null && task.progress > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-1.5" />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs font-medium px-2 py-1 rounded",
                priorityColors[task.priority as keyof typeof priorityColors]
              )}
            >
              {task.priority}
            </Badge>
            {task.dueDate && (
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
            {task.status === "done" && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
          
          {task.assignee && (
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium",
                getAvatarColor(task.assignee)
              )}>
                {getInitials(task.assignee)}
              </div>
            </div>
          )}
        </div>
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={task}
        projects={projects}
      />
    </>
  );
}
