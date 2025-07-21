import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar,
  Clock,
  Flag,
  MessageCircle,
  User,
  Save,
  X,
  Plus,
  Edit3,
  CheckCircle,
  AlertCircle,
  FileText,
  Hash,
  Play,
  Pause,
  XCircle,
  Target,
  Zap,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor, RichTextRenderer } from "@/components/rich-text-editor";
import type { Task, Comment, Project, Application } from "@shared/schema";

// Beautiful status configurations
const statusConfig = {
  'todo': {
    label: 'Open',
    icon: <Play className="h-4 w-4" />,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    emoji: '🔵'
  },
  'in-progress': {
    label: 'In Progress',
    icon: <Zap className="h-4 w-4" />,
    color: 'from-orange-500 to-yellow-500',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    emoji: '⚡'
  },
  'blocked': {
    label: 'Blocked',
    icon: <XCircle className="h-4 w-4" />,
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    emoji: '🚫'
  },
  'done': {
    label: 'Closed',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    emoji: '✅'
  }
};

const priorityConfig = {
  'low': {
    label: 'Low Priority',
    color: 'from-gray-500 to-slate-500',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    emoji: '🟢'
  },
  'medium': {
    label: 'Medium Priority',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    emoji: '🟡'
  },
  'high': {
    label: 'High Priority',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    emoji: '🔴'
  }
};

interface TaskEditModalProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskEditModal({ task, open, onOpenChange }: TaskEditModalProps) {
  // Early return if task is null/undefined
  if (!task) {
    return null;
  }

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status || "todo");
  const [priority, setPriority] = useState(task.priority || "medium");
  const [assignee, setAssignee] = useState(task.assignee || "");
  const [progress, setProgress] = useState(task.progress || 0);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'comments' | 'activity'>('overview');

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handleQuickUpdate = (field: string, value: any) => {
    updateTaskMutation.mutate({ [field]: value });
  };

  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.todo;
  const currentPriority = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

  const getDueDateStatus = () => {
    if (!task?.dueDate) return null;
    const now = new Date();
    const due = new Date(task.dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)} days`, color: 'text-red-500' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-orange-500' };
    if (diffDays <= 3) return { text: `Due in ${diffDays} days`, color: 'text-yellow-500' };
    return { text: `Due in ${diffDays} days`, color: 'text-green-500' };
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[95vh] overflow-hidden p-0 border-0 bg-transparent">
        <div className="h-full bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-3xl shadow-2xl border border-white/20 backdrop-blur-sm overflow-hidden">
          
          {/* Stunning Header */}
          <div className="relative h-48 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-x-48 -translate-y-48 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-tl from-cyan-400/20 to-transparent rounded-full translate-x-36 translate-y-36" />
            
            {/* Header Content */}
            <div className="relative h-full flex items-center justify-between p-8 text-white">
              <div className="flex items-center space-x-6">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${currentStatus.color} shadow-lg`}>
                  {currentStatus.icon}
                </div>
                
                <div className="space-y-2">
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
                      className="text-2xl font-bold bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                      autoFocus
                    />
                  ) : (
                    <h1 
                      className="text-3xl font-bold cursor-pointer hover:bg-white/20 rounded-xl px-4 py-2 -mx-4 -my-2 transition-all duration-300 flex items-center gap-3 group"
                      onClick={() => setEditingTitle(true)}
                    >
                      {title}
                      <Edit3 className="h-5 w-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </h1>
                  )}
                  
                  <div className="flex items-center space-x-4 text-white/90">
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <Hash className="h-4 w-4" />
                      <span className="font-medium">#{task?.id || 0}</span>
                    </div>
                    
                    {dueDateStatus && (
                      <div className={`flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm`}>
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">{dueDateStatus.text}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{assignee || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-white/20 h-12 w-12 rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white/60 backdrop-blur-sm border-b border-white/20 p-6">
            <div className="flex space-x-1 bg-white/50 p-1.5 rounded-2xl">
              {[
                { id: 'overview', label: 'Overview', icon: <Target className="h-4 w-4" /> },
                { id: 'details', label: 'Details', icon: <FileText className="h-4 w-4" /> },
                { id: 'comments', label: 'Comments', icon: <MessageCircle className="h-4 w-4" /> },
                { id: 'activity', label: 'Activity', icon: <TrendingUp className="h-4 w-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
                    activeTab === tab.id 
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105" 
                      : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 overflow-auto">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-12 gap-8">
                {/* Main Content */}
                <div className="col-span-8 space-y-6">
                  {/* Progress Card */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-xl border border-white/20">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                          Task Progress
                        </h3>
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                        {progress}%
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Progress value={progress} className="h-3 bg-gradient-to-r from-gray-200 to-gray-300" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        onMouseUp={() => handleQuickUpdate("progress", progress)}
                        className="w-full h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>

                  {/* Description Card */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-xl border border-white/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl text-white">
                        <FileText className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Description
                      </h3>
                    </div>
                    
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() => {
                        if (description !== task.description) {
                          updateTaskMutation.mutate({ description });
                        }
                      }}
                      placeholder="Add a detailed description..."
                      className="min-h-[150px] bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 focus:border-blue-400 rounded-xl resize-none transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Sidebar */}
                <div className="col-span-4 space-y-6">
                  {/* Status Card */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-xl border border-white/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 bg-gradient-to-br ${currentStatus.color} rounded-xl text-white`}>
                        <Flag className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Status
                      </h3>
                    </div>
                    
                    <Select 
                      value={status} 
                      onValueChange={(value) => {
                        setStatus(value);
                        handleQuickUpdate("status", value);
                      }}
                    >
                      <SelectTrigger className="h-12 bg-gradient-to-br from-white to-gray-100 border-2 border-gray-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{config.emoji}</span>
                              <span className="font-medium">{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority Card */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-xl border border-white/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 bg-gradient-to-br ${currentPriority.color} rounded-xl text-white`}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Priority
                      </h3>
                    </div>
                    
                    <Select 
                      value={priority} 
                      onValueChange={(value) => {
                        setPriority(value);
                        handleQuickUpdate("priority", value);
                      }}
                    >
                      <SelectTrigger className="h-12 bg-gradient-to-br from-white to-gray-100 border-2 border-gray-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{config.emoji}</span>
                              <span className="font-medium">{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignee Card */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-xl border border-white/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
                        <User className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Assignee
                      </h3>
                    </div>
                    
                    <div className="flex gap-3">
                      <Input
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        placeholder="Enter assignee name..."
                        className="flex-1 h-12 bg-gradient-to-br from-white to-gray-100 border-2 border-gray-200 rounded-xl"
                      />
                      <Button
                        onClick={() => updateTaskMutation.mutate({ assignee })}
                        disabled={assignee === task.assignee || updateTaskMutation.isPending}
                        className="h-12 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-lg"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <CommentSection taskId={task?.id || 0} />
            )}

            {activeTab === 'details' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-xl border border-white/20">
                  <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Task Details
                  </h2>
                  <div className="prose prose-lg max-w-none">
                    <RichTextRenderer content={description || "No detailed description available."} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-xl border border-white/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Activity Timeline
                    </h2>
                  </div>
                  
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-lg font-medium mb-2">No activity yet</p>
                    <p className="text-sm">Task activity will appear here as changes are made.</p>
                  </div>
                </div>
              </div>
            )}
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl text-white">
          <MessageCircle className="h-6 w-6" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Comments ({comments.length})
        </h2>
      </div>
      
      {/* Add new comment */}
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 shadow-xl border border-white/20">
        <div className="flex gap-6 mb-6">
          <Avatar className="h-12 w-12 ring-4 ring-blue-200">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
              CU
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <RichTextEditor
              value={newComment}
              onChange={setNewComment}
              placeholder="Share your thoughts..."
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleAddComment}
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg text-lg font-medium"
          >
            {addCommentMutation.isPending ? (
              <>
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Add Comment
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-6">
        {comments.map((comment, index) => (
          <div 
            key={comment.id || index} 
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex gap-4">
              <Avatar className="h-12 w-12 ring-4 ring-blue-200">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                  {(comment.author || 'Unknown User').split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-4">
                  <h4 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {comment.author || 'Unknown User'}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    <Clock className="h-3 w-3" />
                    <span>
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border-2 border-gray-100">
                  <RichTextRenderer content={comment.content ? (typeof comment.content === 'string' ? comment.content : JSON.stringify(comment.content)) : 'No content'} />
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {comments.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-12 max-w-md mx-auto shadow-xl border border-white/20">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No comments yet</h3>
              <p className="text-gray-500">Start the conversation by adding the first comment!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskEditModal;