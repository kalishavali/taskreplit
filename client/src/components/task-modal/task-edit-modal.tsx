import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  Clock,
  Flag,
  MessageCircle,
  User,
  Save,
  X,
  Plus,
  Paperclip,
  MoreHorizontal,
  Edit3,
  CheckCircle,
  AlertCircle,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, Comment, Project, Application } from "@shared/schema";

interface TaskEditModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  applicationId?: number;
}

const priorityColors = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200", 
  high: "bg-red-100 text-red-700 border-red-200",
  urgent: "bg-purple-100 text-purple-700 border-purple-200"
};

const statusColors = {
  todo: "bg-gray-100 text-gray-700 border-gray-200",
  inprogress: "bg-orange-100 text-orange-700 border-orange-200",
  review: "bg-blue-100 text-blue-700 border-blue-200", 
  done: "bg-green-100 text-green-700 border-green-200"
};

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
      return await apiRequest("/api/comments", 'POST', {
        taskId,
        content,
        author: "Current User" // TODO: Get from auth
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", taskId] });
      setNewComment("");
      toast({ title: "Comment added successfully" });
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
      <h3 className="font-semibold text-lg">Comments ({comments.length})</h3>
      
      {/* Add new comment */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-purple-100 text-purple-700">
              CU
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none border-gray-200 focus:ring-2 focus:ring-blue-500"
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

      <Separator />

      {/* Comments list */}
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {comment.author.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.author}</span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                {typeof comment.content === 'string' ? comment.content : JSON.stringify(comment.content)}
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

export function TaskEditModal({ task, open, onOpenChange, projectId, applicationId }: TaskEditModalProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState(task?.status || "todo");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [progress, setProgress] = useState(task?.progress || 0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssignee(task.assignee || "");
      setProgress(task.progress || 0);
    }
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      if (!task) return;
      return await apiRequest(`/api/tasks/${task.id}`, 'PATCH', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update task",
        variant: "destructive" 
      });
    }
  });

  const handleSave = () => {
    updateTaskMutation.mutate({
      title,
      description,
      status,
      priority,
      assignee: assignee || null,
      progress
    });
  };

  const handleQuickUpdate = (field: string, value: any) => {
    updateTaskMutation.mutate({ [field]: value });
  };

  if (!task) return null;

  const getDueDateStatus = () => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { color: "text-red-600", text: "Overdue" };
    if (diffDays === 0) return { color: "text-orange-600", text: "Due today" };
    if (diffDays <= 3) return { color: "text-yellow-600", text: `Due in ${diffDays} days` };
    return { color: "text-gray-600", text: `Due in ${diffDays} days` };
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              {editingTitle ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => {
                    setEditingTitle(false);
                    if (title !== task.title) {
                      updateTaskMutation.mutate({ title });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditingTitle(false);
                      if (title !== task.title) {
                        updateTaskMutation.mutate({ title });
                      }
                    }
                  }}
                  className="text-xl font-bold border-none p-0 h-auto focus-visible:ring-0"
                  autoFocus
                />
              ) : (
                <DialogTitle 
                  className="text-xl cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 flex items-center gap-2"
                  onClick={() => setEditingTitle(true)}
                >
                  {task.title}
                  <Edit3 className="h-4 w-4 opacity-40" />
                </DialogTitle>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Task #{task.id}</span>
                {dueDateStatus && (
                  <>
                    <span>•</span>
                    <div className={cn("flex items-center gap-1", dueDateStatus.color)}>
                      <Calendar className="h-3 w-3" />
                      <span>{dueDateStatus.text}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-auto space-y-6 mt-4">
              <div className="grid grid-cols-3 gap-6">
                {/* Main content */}
                <div className="col-span-2 space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="font-semibold mb-3">Description</h3>
                    {editingDescription ? (
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => {
                          setEditingDescription(false);
                          if (description !== task.description) {
                            updateTaskMutation.mutate({ description });
                          }
                        }}
                        className="min-h-[120px] resize-none"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="min-h-[120px] p-3 border rounded-md cursor-pointer hover:bg-gray-50 text-sm"
                        onClick={() => setEditingDescription(true)}
                      >
                        {description || (
                          <span className="text-gray-400 italic">
                            Click to add description...
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Progress</h3>
                      <span className="text-sm text-gray-500">{progress}%</span>
                    </div>
                    <Progress value={progress} className="mb-2" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      onMouseUp={() => handleQuickUpdate("progress", progress)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Status */}
                  <div>
                    <h3 className="font-semibold mb-2">Status</h3>
                    <Select 
                      value={status} 
                      onValueChange={(value) => {
                        setStatus(value);
                        handleQuickUpdate("status", value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            To Do
                          </div>
                        </SelectItem>
                        <SelectItem value="inprogress">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                            In Progress
                          </div>
                        </SelectItem>
                        <SelectItem value="review">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            Review
                          </div>
                        </SelectItem>
                        <SelectItem value="done">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            Done
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div>
                    <h3 className="font-semibold mb-2">Priority</h3>
                    <Select 
                      value={priority} 
                      onValueChange={(value) => {
                        setPriority(value);
                        handleQuickUpdate("priority", value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-green-600" />
                            Low
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-yellow-600" />
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-red-600" />
                            High
                          </div>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <div className="flex items-center gap-2">
                            <Flag className="h-3 w-3 text-purple-600" />
                            Urgent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignee */}
                  <div>
                    <h3 className="font-semibold mb-2">Assignee</h3>
                    <Input
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      onBlur={() => {
                        if (assignee !== task.assignee) {
                          handleQuickUpdate("assignee", assignee || null);
                        }
                      }}
                      placeholder="Assign to..."
                    />
                  </div>

                  {/* Time tracking */}
                  <div>
                    <h3 className="font-semibold mb-2">Time Tracking</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estimated:</span>
                        <span>{task.estimatedHours || 0}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Logged:</span>
                        <span>{task.actualHours || 0}h</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Remaining:</span>
                        <span>
                          {Math.max(0, (task.estimatedHours || 0) - (task.actualHours || 0))}h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="flex-1 overflow-auto mt-4">
              <CommentSection taskId={task.id} />
            </TabsContent>

            <TabsContent value="activity" className="flex-1 overflow-auto mt-4">
              <div className="text-center py-8 text-gray-500">
                <Archive className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Activity log coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={updateTaskMutation.isPending}>
            {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}