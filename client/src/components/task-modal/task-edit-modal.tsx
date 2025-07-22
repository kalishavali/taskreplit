import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar,
  Clock,
  MessageCircle,
  User,
  Save,
  X,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor, RichTextRenderer } from "@/components/rich-text-editor";
import type { Task, Comment, Project, Application, TeamMember } from "@shared/schema";

interface TaskEditModalProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  applicationId?: number;
}

export function TaskEditModal({ task, open, onOpenChange, projectId, applicationId }: TaskEditModalProps) {
  if (!task) {
    return null;
  }

  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status || "Open");
  const [priority, setPriority] = useState(task.priority || "medium");
  const [assignee, setAssignee] = useState(task.assignee || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined);
  const [selectedProjectId, setSelectedProjectId] = useState(task.projectId || projectId);
  const [selectedApplicationId, setSelectedApplicationId] = useState(task.applicationId || applicationId);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"]
  });

  // Fetch project-specific applications when project is selected
  const { data: projectApplications = [] } = useQuery<Application[]>({
    queryKey: ["/api/projects", selectedProjectId, "applications"],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const response = await fetch(`/api/projects/${selectedProjectId}/applications`);
      if (!response.ok) throw new Error("Failed to fetch project applications");
      return response.json();
    },
    enabled: !!selectedProjectId,
  });

  // Fetch team members for assignee dropdown
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"]
  });

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "Open");
      setPriority(task.priority || "medium");
      setAssignee(task.assignee || "");
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setSelectedProjectId(task.projectId || projectId);
      setSelectedApplicationId(task.applicationId || applicationId);
      

    }
  }, [task, projectId, applicationId]);

  // Clear application selection when project changes
  useEffect(() => {
    if (selectedProjectId !== task?.projectId) {
      setSelectedApplicationId(undefined);
    }
  }, [selectedProjectId, task?.projectId]);

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      const response = await apiRequest(`/api/tasks/${task.id}`, "PATCH", updates);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update task",
        variant: "destructive" 
      });
    },
  });

  const handleSave = () => {
    updateTaskMutation.mutate({
      title,
      description,
      status,
      priority,
      assignee,
      dueDate: dueDate?.toISOString() || null,
      projectId: selectedProjectId,
      applicationId: selectedApplicationId
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Task Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full"
            />
          </div>

          {/* Project and Application Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Project</label>
              <Select value={selectedProjectId?.toString()} onValueChange={(value) => setSelectedProjectId(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Application</label>
              <Select 
                value={selectedApplicationId?.toString()} 
                onValueChange={(value) => setSelectedApplicationId(Number(value))}
                disabled={!selectedProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedProjectId ? "Select application..." : "Select project first"} />
                </SelectTrigger>
                <SelectContent>
                  {projectApplications.map((app) => (
                    <SelectItem key={app.id} value={app.id.toString()}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Assignee</label>
            <Select value={assignee || "unassigned"} onValueChange={(value) => setAssignee(value === "unassigned" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.name}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Due Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dueDate ? dueDate.toLocaleDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  disabled={(date) => date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Enter detailed task description..."
            />
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Comments</h3>
            <CommentSection taskId={task.id} />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommentSection({ taskId }: { taskId: number }) {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current user info
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"]
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["/api/comments", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/comments?taskId=${taskId}`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return await response.json() as Comment[];
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("/api/comments", 'POST', {
        taskId,
        content,

      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", taskId] });
      setNewComment("");
      toast({ title: "Comment added successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to add comment",
        variant: "destructive" 
      });
    }
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add new comment */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
              {currentUser ? (currentUser.firstName && currentUser.lastName 
                ? `${currentUser.firstName[0]}${currentUser.lastName[0]}` 
                : currentUser.username.substring(0, 2).toUpperCase()
              ) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <RichTextEditor
              value={newComment}
              onChange={setNewComment}
              placeholder="Write a comment..."
              className="text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            size="sm"
            onClick={handleAddComment}
            disabled={!newComment.trim() || addCommentMutation.isPending}
          >
            {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {comments.map((comment, index) => (
          <div key={comment.id || index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                {(comment.author || 'Unknown User').split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {comment.author || 'Unknown User'}
                </span>
                <span className="text-xs text-gray-500">
                  {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}
                </span>
              </div>
              
              <div className="text-sm text-gray-700">
                <RichTextRenderer 
                  content={comment.content ? (typeof comment.content === 'string' ? comment.content : JSON.stringify(comment.content)) : 'No content'} 
                />
              </div>
            </div>
          </div>
        ))}
        
        {comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskEditModal;