import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { CheckCircle, Calendar, User, MoreHorizontal, Clock } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { TaskEditModal } from "@/components/task-modal/task-edit-modal";
import { RichTextRenderer } from "@/components/rich-text-editor";
import { cn } from "@/lib/utils";
import type { Task, Project } from "@shared/schema";

interface TaskListViewProps {
  tasks: Task[];
  projects?: Project[];
  isLoading?: boolean;
}

export default function TaskListView({ tasks, projects = [], isLoading }: TaskListViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const statusColors = {
    "Open": "bg-gray-100 text-gray-800",
    "In Progress": "bg-blue-100 text-blue-800",
    "InProgress": "bg-blue-100 text-blue-800",
    "Blocked": "bg-red-100 text-red-800",
    "Closed": "bg-green-100 text-green-800",
  };

  const statusLabels = {
    "Open": "Open",
    "In Progress": "In Progress",
    "InProgress": "In Progress", 
    "Blocked": "Blocked",
    "Closed": "Closed",
  };

  const getProject = (projectId: number | null) => {
    return projects?.find(p => p.id === projectId);
  };

  const isOverdue = (dueDate: Date | null, status: string) => {
    if (!dueDate || status === "Closed") return false;
    return new Date(dueDate) < new Date();
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="flex space-x-2">
              <div className="h-5 bg-gray-200 rounded w-16"></div>
              <div className="h-5 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
        <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-80">Task</TableHead>
                <TableHead className="w-40">Project</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-20">Priority</TableHead>
                <TableHead className="w-24">Assignee</TableHead>
                <TableHead className="w-28">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {tasks.map((task) => {
              const project = getProject(task.projectId);
              const overdue = isOverdue(task.dueDate, task.status);
              
              return (
                <TableRow 
                  key={task.id} 
                  className={cn(
                    "hover:bg-gray-50 cursor-pointer",
                    task.status === "Closed" && "opacity-75"
                  )}
                  onClick={() => handleEditTask(task)}
                >
                  <TableCell>
                    {task.status === "Closed" && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-80">
                      <div className="font-medium text-gray-900 break-words">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 truncate max-w-80 overflow-hidden whitespace-nowrap text-ellipsis">
                          {task.description.replace(/<[^>]*>/g, '').trim()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {project && (
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {project.name}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs",
                        statusColors[task.status as keyof typeof statusColors]
                      )}
                    >
                      {statusLabels[task.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs",
                        priorityColors[task.priority as keyof typeof priorityColors]
                      )}
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {task.assignee && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{task.assignee}</span>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {task.dueDate && (
                      <div className={cn(
                        "flex items-center space-x-2 text-sm",
                        overdue ? "text-red-600" : "text-gray-600"
                      )}>
                        {overdue ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <Calendar className="w-4 h-4" />
                        )}
                        <span>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        {overdue && (
                          <Badge variant="destructive" className="text-xs ml-1">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  

                </TableRow>
              );
            })}
          </TableBody>
          </Table>
        </div>
      </div>

      {selectedTask && (
        <TaskEditModal 
          task={selectedTask}
          open={isTaskModalOpen}
          onOpenChange={(open) => {
            setIsTaskModalOpen(open);
            if (!open) {
              setSelectedTask(undefined);
            }
          }}
          projectId={selectedTask.projectId || undefined}
          applicationId={selectedTask.applicationId || undefined}
        />
      )}
    </>
  );
}
