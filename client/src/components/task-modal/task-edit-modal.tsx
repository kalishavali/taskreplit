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
  Archive,
  FileText,
  Hash,
  Play,
  Pause,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor, RichTextRenderer } from "@/components/rich-text-editor";
import type { Task, Comment, Project, Application } from "@shared/schema";

// Utility functions for status styling
function getStatusColor(status: string) {
  switch (status) {
    case 'todo':
      return 'bg-blue-500 text-white';
    case 'in-progress':
      return 'bg-yellow-500 text-white';
    case 'blocked':
      return 'bg-red-500 text-white';
    case 'done':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'todo':
      return <Play className="h-4 w-4" />;
    case 'in-progress':
      return <Clock className="h-4 w-4" />;
    case 'blocked':
      return <XCircle className="h-4 w-4" />;
    case 'done':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Flag className="h-4 w-4" />;
  }
}



// Component to edit project and application info
function EditableProjectAndApplicationInfo({ 
  projectId, 
  applicationId, 
  onProjectChange, 
  onApplicationChange 
}: { 
  projectId?: number | null, 
  applicationId?: number | null,
  onProjectChange: (projectId: number | null) => void,
  onApplicationChange: (applicationId: number | null) => void
}) {
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isEditingApplication, setIsEditingApplication] = useState(false);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const project = projects.find(p => p.id === projectId);
  const application = applications.find(a => a.id === applicationId);

  return (
    <div className="space-y-3 text-sm">
      {/* Project Selection */}
      <div className="flex justify-between items-center">
        <span className="text-gray-600 font-medium">Project:</span>
        {isEditingProject ? (
          <div className="flex items-center gap-2">
            <Select value={projectId?.toString() || "none"} onValueChange={(value) => {
              const newProjectId = value && value !== "none" ? parseInt(value) : null;
              onProjectChange(newProjectId);
              setIsEditingProject(false);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={() => setIsEditingProject(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-gray-900">{project?.name || "Unassigned"}</span>
            <Button size="sm" variant="ghost" onClick={() => setIsEditingProject(true)}>
              <Edit3 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Application Selection */}
      <div className="flex justify-between items-center">
        <span className="text-gray-600 font-medium">Application:</span>
        {isEditingApplication ? (
          <div className="flex items-center gap-2">
            <Select value={applicationId?.toString() || "none"} onValueChange={(value) => {
              const newApplicationId = value && value !== "none" ? parseInt(value) : null;
              onApplicationChange(newApplicationId);
              setIsEditingApplication(false);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select application" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No application</SelectItem>
                {applications.map((application) => (
                  <SelectItem key={application.id} value={application.id.toString()}>
                    {application.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={() => setIsEditingApplication(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-gray-900">{application?.name || "Not specified"}</span>
            <Button size="sm" variant="ghost" onClick={() => setIsEditingApplication(true)}>
              <Edit3 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

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

  const { data: comments = [], refetch: refetchComments } = useQuery<Comment[]>({
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
        author: "Current User" // TODO: Get from auth
      });
      return response;
    },
    onSuccess: (newComment) => {
      // Immediately update the cache with the new comment
      queryClient.setQueryData(["/api/comments", taskId], (oldComments: Comment[] = []) => {
        // Create comment with proper metadata
        const commentWithDate = {
          ...newComment,
          createdAt: new Date().toISOString(),
          id: Date.now() // Temporary ID until server confirms
        };
        return [...oldComments, commentWithDate];
      });
      setNewComment("");
      toast({ title: "Comment added successfully" });
      
      // Refetch to get server-confirmed data shortly after
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/comments", taskId] });
      }, 100);
    },
    onError: (error) => {
      console.error("Failed to add comment:", error);
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg text-white">
          <MessageCircle className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Comments ({comments.length})
        </h3>
      </div>
      
      {/* Add new comment */}
      <div className="glass rounded-2xl p-6 shadow-lg animate-slide-up">
        <div className="flex gap-4 mb-4">
          <Avatar className="h-10 w-10 ring-2 ring-gradient-to-r from-blue-400 to-purple-400">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
              CU
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <RichTextEditor
              value={newComment}
              onChange={setNewComment}
              placeholder="Write your comment here..."
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            size="sm" 
            onClick={handleAddComment}
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {addCommentMutation.isPending ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Comment
              </>
            )}
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
                {comment.author ? comment.author.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.author || 'Unknown User'}</span>
                <span className="text-xs text-gray-500">
                  {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <RichTextRenderer content={comment.content ? (typeof comment.content === 'string' ? comment.content : JSON.stringify(comment.content)) : 'No content'} />
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
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [currentApplicationId, setCurrentApplicationId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize project and application IDs when task or defaults change
  useEffect(() => {
    if (task) {
      setCurrentProjectId(task.projectId || projectId || null);
      setCurrentApplicationId(task.applicationId || applicationId || null);
    }
  }, [task, projectId, applicationId]);

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
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col glass border-0 shadow-2xl">
        {/* Beautiful gradient header */}
        <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 -m-6 mb-4 rounded-t-xl">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-t-xl" />
          <div className="relative flex items-start justify-between text-white">
            <div className="flex-1 space-y-3">
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
                  className="text-2xl font-bold bg-white/20 border-white/30 text-white placeholder-white/70 focus:bg-white/30 transition-all duration-300"
                  autoFocus
                />
              ) : (
                <DialogTitle 
                  className="text-2xl font-bold cursor-pointer hover:bg-white/20 rounded-lg px-3 py-2 -mx-3 -my-2 flex items-center gap-3 transition-all duration-300 group"
                  onClick={() => setEditingTitle(true)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(task.status)} shadow-lg`}>
                      {getStatusIcon(task.status)}
                    </div>
                    <span>{task.title}</span>
                    <Edit3 className="h-5 w-5 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </DialogTitle>
              )}
              
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                  <Hash className="h-4 w-4" />
                  <span className="font-medium">Task #{task.id}</span>
                </div>
                {dueDateStatus && (
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{dueDateStatus.text}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{task.assignee || 'Unassigned'}</span>
                </div>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20 hover:text-white transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 glass border-0 shadow-lg">
              <TabsTrigger value="details" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300">
                <FileText className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="comments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300">
                <MessageCircle className="h-4 w-4 mr-2" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white transition-all duration-300">
                <Clock className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-auto space-y-6 mt-6 custom-scrollbar">
              <div className="grid grid-cols-3 gap-8">
                {/* Main content */}
                <div className="col-span-2 space-y-8">
                  {/* Description */}
                  <div className="glass rounded-2xl p-6 shadow-lg animate-slide-up">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg text-white">
                        <FileText className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Description</h3>
                    </div>
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
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      onMouseUp={() => handleQuickUpdate("progress", progress)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
                        <SelectItem value="Open">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            Open
                          </div>
                        </SelectItem>
                        <SelectItem value="InProgress">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                            In Progress
                          </div>
                        </SelectItem>
                        <SelectItem value="Blocked">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            Blocked
                          </div>
                        </SelectItem>
                        <SelectItem value="Closed">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            Closed
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

                  {/* Project & Application Info */}
                  <div>
                    <h3 className="font-semibold mb-2">Project & Application</h3>
                    <div className="space-y-2 text-sm">
                      <EditableProjectAndApplicationInfo 
                        projectId={currentProjectId} 
                        applicationId={currentApplicationId}
                        onProjectChange={(newProjectId) => {
                          setCurrentProjectId(newProjectId);
                          updateTaskMutation.mutate({ projectId: newProjectId });
                        }}
                        onApplicationChange={(newApplicationId) => {
                          setCurrentApplicationId(newApplicationId);
                          updateTaskMutation.mutate({ applicationId: newApplicationId });
                        }}
                      />
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <h3 className="font-semibold mb-2">Due Date</h3>
                    <div className="text-sm">
                      {dueDateStatus ? (
                        <div className={`${dueDateStatus.color} font-medium`}>
                          {dueDateStatus.text}
                        </div>
                      ) : (
                        <span className="text-gray-500">No due date set</span>
                      )}
                      {task.dueDate && (
                        <div className="text-gray-600 mt-1">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time tracking */}
                  <div>
                    <h3 className="font-semibold mb-2">Task Progress</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Progress:</span>
                        <span>{task.progress || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="capitalize">{task.status}</span>
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