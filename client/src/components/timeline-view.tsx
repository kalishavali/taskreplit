import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskEditModal } from "@/components/task-modal/task-edit-modal";
import type { Task, Project } from "@shared/schema";

interface TimelineViewProps {
  tasks: Task[];
  projects?: Project[];
  isLoading?: boolean;
}

export default function TimelineView({ tasks, projects = [], isLoading }: TimelineViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const priorityColors = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-red-100 text-red-800 border-red-200",
    urgent: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const statusColors = {
    Open: "bg-gray-100 text-gray-800 border-gray-200",
    InProgress: "bg-blue-100 text-blue-800 border-blue-200",
    Blocked: "bg-red-100 text-red-800 border-red-200",
    Closed: "bg-green-100 text-green-800 border-green-200",
  };

  const getProject = (projectId: number | null) => {
    return projects?.find(p => p.id === projectId);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  // Sort tasks by creation date and group by month
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
  );

  const groupedTasks = sortedTasks.reduce((groups: Record<string, Task[]>, task) => {
    const date = new Date(task.createdAt || '');
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(task);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2].map((j) => (
                <Card key={j} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
        <p className="text-sm text-gray-500">Tasks will appear here as they are created.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {Object.entries(groupedTasks).map(([month, monthTasks]) => (
          <div key={month} className="space-y-4">
            <div className="sticky top-0 bg-gray-50 -mx-6 px-6 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{month}</h3>
            </div>
            
            <div className="space-y-4 relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200"></div>
              
              {monthTasks.map((task, index) => {
                const project = getProject(task.projectId);
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Closed';
                
                return (
                  <div key={task.id} className="relative flex items-start space-x-6">
                    {/* Timeline dot */}
                    <div className={cn(
                      "flex-shrink-0 w-4 h-4 rounded-full border-2 bg-white relative z-10",
                      task.status === 'Closed' ? "border-green-500" :
                      task.status === 'InProgress' ? "border-blue-500" :
                      task.status === 'Blocked' ? "border-red-500" :
                      "border-gray-300"
                    )}>
                      <div className={cn(
                        "absolute inset-1 rounded-full",
                        task.status === 'Closed' ? "bg-green-500" :
                        task.status === 'InProgress' ? "bg-blue-500" :
                        task.status === 'Blocked' ? "bg-red-500" :
                        "bg-gray-300"
                      )}></div>
                    </div>
                    
                    {/* Task card */}
                    <Card 
                      className={cn(
                        "flex-1 cursor-pointer hover:shadow-md transition-shadow",
                        task.status === 'Closed' && "opacity-75"
                      )}
                      onClick={() => handleEditTask(task)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Badge 
                              variant="outline"
                              className={cn("text-xs", statusColors[task.status as keyof typeof statusColors])}
                            >
                              {task.status}
                            </Badge>
                            <Badge 
                              variant="outline"
                              className={cn("text-xs", priorityColors[task.priority as keyof typeof priorityColors])}
                            >
                              <Flag className="w-3 h-3 mr-1" />
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            {project && (
                              <span className="inline-flex items-center">
                                <span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
                                {project.name}
                              </span>
                            )}
                            
                            {task.assignee && (
                              <span className="inline-flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {task.assignee}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            {task.dueDate && (
                              <span className={cn(
                                "inline-flex items-center",
                                isOverdue ? "text-red-600" : "text-gray-500"
                              )}>
                                <Clock className="w-3 h-3 mr-1" />
                                Due {new Date(task.dueDate).toLocaleDateString()}
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs ml-2">
                                    Overdue
                                  </Badge>
                                )}
                              </span>
                            )}
                            
                            <span className="inline-flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(task.createdAt || '').toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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