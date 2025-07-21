import { useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import Column from "./column";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, Project } from "@shared/schema";

interface KanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  isLoading?: boolean;
}

const COLUMNS = [
  { id: "todo", title: "To Do", status: "todo" },
  { id: "inprogress", title: "In Progress", status: "inprogress" },
  { id: "done", title: "Done", status: "done" },
];

export default function KanbanBoard({ tasks, projects, isLoading }: KanbanBoardProps) {
  const { toast } = useToast();

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    updateTaskStatusMutation.mutate({ taskId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex space-x-6">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <div className="bg-gray-200 w-6 h-6 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-6 overflow-x-auto">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter(task => task.status === column.status);
            
            return (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-shrink-0 w-80"
                  >
                    <Column
                      column={column}
                      tasks={columnTasks}
                      projects={projects}
                      isDraggingOver={snapshot.isDraggingOver}
                    />
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
