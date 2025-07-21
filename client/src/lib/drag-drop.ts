import { DropResult } from "react-beautiful-dnd";

export interface DragDropConfig {
  onDragEnd: (result: DropResult) => void;
  droppableId: string;
}

export const handleDragEnd = (
  result: DropResult,
  onStatusChange: (taskId: number, newStatus: string) => void
) => {
  const { destination, source, draggableId } = result;

  // If no destination, do nothing
  if (!destination) {
    return;
  }

  // If dropped in the same position, do nothing
  if (
    destination.droppableId === source.droppableId &&
    destination.index === source.index
  ) {
    return;
  }

  const taskId = parseInt(draggableId);
  const newStatus = destination.droppableId;

  onStatusChange(taskId, newStatus);
};

export const getItemStyle = (isDragging: boolean, draggableStyle: any) => ({
  // Some basic styles to make the items look a bit nicer
  userSelect: "none" as const,
  
  // Change background color if dragging
  background: isDragging ? "rgb(255, 255, 255)" : "rgb(255, 255, 255)",
  
  // Styles we need to apply on draggables
  ...draggableStyle,
  
  // Add shadow and scale when dragging
  ...(isDragging && {
    transform: `${draggableStyle.transform} rotate(2deg) scale(1.05)`,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  }),
});

export const getListStyle = (isDraggingOver: boolean) => ({
  background: isDraggingOver ? "rgb(239, 246, 255)" : "rgb(249, 250, 251)",
  transition: "background-color 0.2s ease",
  borderColor: isDraggingOver ? "rgb(147, 197, 253)" : "transparent",
  borderWidth: isDraggingOver ? "2px" : "0px",
  borderStyle: "dashed",
});

export const validateDrop = (
  source: { droppableId: string; index: number },
  destination: { droppableId: string; index: number } | null
): boolean => {
  if (!destination) return false;
  
  // Allow drops to different columns
  if (source.droppableId !== destination.droppableId) return true;
  
  // Allow reordering within the same column
  if (source.index !== destination.index) return true;
  
  return false;
};

export const COLUMN_IDS = {
  TODO: "todo",
  IN_PROGRESS: "inprogress", 
  DONE: "done",
} as const;

export type ColumnId = typeof COLUMN_IDS[keyof typeof COLUMN_IDS];

export const COLUMN_CONFIG = [
  { id: COLUMN_IDS.TODO, title: "To Do", status: "todo" },
  { id: COLUMN_IDS.IN_PROGRESS, title: "In Progress", status: "inprogress" },
  { id: COLUMN_IDS.DONE, title: "Done", status: "done" },
];
