import { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TaskCard from "./task-card";
import TaskModal from "@/components/modals/task-modal";
import { cn } from "@/lib/utils";
import type { Task, Project } from "@shared/schema";

interface ColumnProps {
  column: {
    id: string;
    title: string;
    status: string;
  };
  tasks: Task[];
  projects: Project[];
  isDraggingOver: boolean;
}

export default function Column({ column, tasks, projects, isDraggingOver }: ColumnProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  return (
    <div className={cn(
      "bg-gray-50 rounded-lg p-4 transition-colors",
      isDraggingOver && "bg-blue-50 border-2 border-blue-300 border-dashed"
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{column.title}</h3>
        <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div className="space-y-3 min-h-[200px]">
        {tasks.map((task, index) => (
          <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                <TaskCard 
                  task={task} 
                  projects={projects}
                  isDragging={snapshot.isDragging}
                />
              </div>
            )}
          </Draggable>
        ))}
      </div>
      
      <Button
        variant="ghost"
        className="w-full mt-3 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900"
        onClick={() => setIsTaskModalOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Task
      </Button>

      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        projects={projects}
        initialStatus={column.status}
      />
    </div>
  );
}
