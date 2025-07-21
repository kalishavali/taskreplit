import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Play, Pause, Square, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow, format } from 'date-fns';

interface TimeEntry {
  id: number;
  taskId: number;
  userId: string;
  description: string | null;
  hours: number; // in minutes
  date: string;
  createdAt: string;
}

interface Task {
  id: number;
  title: string;
  status: string;
  projectId?: number;
}

export function TimeTracker({ taskId, userId = "sarah@company.com" }: { taskId?: number; userId?: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStart, setTrackingStart] = useState<Date | null>(null);
  const [currentSession, setCurrentSession] = useState(0);
  const queryClient = useQueryClient();

  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['time-entries', taskId, userId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (taskId) params.append('taskId', taskId.toString());
      if (userId) params.append('userId', userId);
      const response = await apiRequest(`/api/time-entries?${params}`);
      return response as TimeEntry[];
    },
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await apiRequest('/api/tasks');
      return response as Task[];
    },
  });

  const createTimeEntryMutation = useMutation({
    mutationFn: async (data: {
      taskId: number;
      userId: string;
      description?: string;
      hours: number;
      date?: string;
    }) => {
      return await apiRequest('/api/time-entries', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      setIsDialogOpen(false);
    },
  });

  const deleteTimeEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/time-entries/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });

  const startTracking = () => {
    setIsTracking(true);
    setTrackingStart(new Date());
    
    // Update session time every second
    const interval = setInterval(() => {
      if (trackingStart) {
        const now = new Date();
        const diff = Math.floor((now.getTime() - trackingStart.getTime()) / 1000 / 60); // minutes
        setCurrentSession(diff);
      }
    }, 1000);

    // Store interval ID for cleanup
    (window as any).trackingInterval = interval;
  };

  const stopTracking = () => {
    setIsTracking(false);
    if ((window as any).trackingInterval) {
      clearInterval((window as any).trackingInterval);
    }
    
    // Auto-create time entry if there's significant time tracked
    if (currentSession > 0 && taskId) {
      createTimeEntryMutation.mutate({
        taskId,
        userId,
        description: `Time tracking session`,
        hours: currentSession,
      });
    }
    
    setCurrentSession(0);
    setTrackingStart(null);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTotalTime = () => {
    return timeEntries.reduce((total, entry) => total + entry.hours, 0);
  };

  return (
    <div className="space-y-4">
      {/* Time Tracking Controls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Tracking</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Current Session */}
            {isTracking && (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Tracking: {formatDuration(currentSession)}</span>
                </div>
                <Button size="sm" variant="outline" onClick={stopTracking}>
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2">
              {!isTracking ? (
                <Button 
                  size="sm" 
                  onClick={startTracking}
                  disabled={!taskId}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start Timer
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={stopTracking} className="flex-1">
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              )}
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Entry
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Time Entry</DialogTitle>
                  </DialogHeader>
                  <AddTimeEntryForm 
                    tasks={tasks}
                    defaultTaskId={taskId}
                    userId={userId}
                    onSubmit={(data) => createTimeEntryMutation.mutate(data)}
                    isSubmitting={createTimeEntryMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Total Time */}
            <div className="text-sm text-muted-foreground">
              Total: {formatDuration(getTotalTime())}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries List */}
      {timeEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeEntries.slice(0, 5).map((entry) => {
                const task = tasks.find(t => t.id === entry.taskId);
                return (
                  <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {task?.title || `Task #${entry.taskId}`}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {formatDuration(entry.hours)}
                        </Badge>
                      </div>
                      {entry.description && (
                        <p className="text-xs text-muted-foreground">{entry.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.date), 'MMM d, yyyy')} • 
                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteTimeEntryMutation.mutate(entry.id)}
                      disabled={deleteTimeEntryMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AddTimeEntryForm({
  tasks,
  defaultTaskId,
  userId,
  onSubmit,
  isSubmitting,
}: {
  tasks: Task[];
  defaultTaskId?: number;
  userId: string;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    taskId: defaultTaskId || '',
    hours: '',
    minutes: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalMinutes = parseInt(formData.hours) * 60 + parseInt(formData.minutes);
    
    onSubmit({
      taskId: parseInt(formData.taskId.toString()),
      userId,
      description: formData.description,
      hours: totalMinutes,
      date: formData.date,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="task">Task</Label>
        <Select 
          value={formData.taskId.toString()} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, taskId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a task" />
          </SelectTrigger>
          <SelectContent>
            {tasks.map((task) => (
              <SelectItem key={task.id} value={task.id.toString()}>
                {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hours">Hours</Label>
          <Input
            id="hours"
            type="number"
            min="0"
            value={formData.hours}
            onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="minutes">Minutes</Label>
          <Input
            id="minutes"
            type="number"
            min="0"
            max="59"
            value={formData.minutes}
            onChange={(e) => setFormData(prev => ({ ...prev, minutes: e.target.value }))}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What did you work on?"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isSubmitting || !formData.taskId}>
        {isSubmitting ? 'Adding...' : 'Add Time Entry'}
      </Button>
    </form>
  );
}