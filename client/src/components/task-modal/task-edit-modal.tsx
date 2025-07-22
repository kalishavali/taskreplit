import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import type { Task, Comment, Project, Application } from "@shared/schema";

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
  const [selectedProjectId, setSelectedProjectId] = useState(task.projectId || projectId);
  const [selectedApplicationId, setSelectedApplicationId] = useState(task.applicationId || applicationId);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects and applications for dropdowns
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"]
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"]
  });

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "Open");
      setPriority(task.priority || "medium");
      setAssignee(task.assignee || "");
      setSelectedProjectId(task.projectId || projectId);
      setSelectedApplicationId(task.applicationId || applicationId);
    }
  }, [task, projectId, applicationId]);

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
      projectId: selectedProjectId,
      applicationId: selectedApplicationId
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Task Details</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
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
              <Select value={selectedApplicationId?.toString()} onValueChange={(value) => setSelectedApplicationId(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select application..." />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
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
                  <SelectValue />
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
            <Input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Enter assignee name"
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              className="min-h-[120px] resize-none"
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
        author: "Current User"
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
              CU
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[60px] resize-none text-sm"
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
                {comment.content ? (typeof comment.content === 'string' ? comment.content : JSON.stringify(comment.content)) : 'No content'}
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