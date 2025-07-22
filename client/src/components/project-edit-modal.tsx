import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar, X, Plus, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Project, Application } from "@shared/schema";

interface ProjectEditModalProps {
  project?: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectEditModal({ project, open, onOpenChange }: ProjectEditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "blue",
    status: "active",
    startDate: "",
    endDate: "",
    assignees: [] as string[],
    teamMembers: [] as string[],
    tags: [] as string[],
  });
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [newAssignee, setNewAssignee] = useState("");
  const [newTag, setNewTag] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: projectApplications = [] } = useQuery<{applicationId: number}[]>({
    queryKey: ["/api/projects", project?.id, "applications"],
    enabled: !!project?.id,
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!project?.id) throw new Error("No project ID");
      return await apiRequest(`/api/projects/${project.id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update project", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateProjectApplicationsMutation = useMutation({
    mutationFn: async (applicationIds: number[]) => {
      if (!project?.id) throw new Error("No project ID");
      return await apiRequest(`/api/projects/${project.id}/applications`, 'PUT', {
        applicationIds
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "applications"] });
    },
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        color: project.color || "blue",
        status: project.status || "active",
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
        assignees: project.assignees || [],
        teamMembers: project.teamMembers || [],
        tags: project.tags || [],
      });
    }
  }, [project]);

  useEffect(() => {
    if (project?.id && projectApplications) {
      setSelectedApplications(projectApplications.map(pa => pa.applicationId));
    }
  }, [project?.id, projectApplications]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData = {
      name: formData.name,
      description: formData.description || null,
      color: formData.color,
      status: formData.status,
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      endDate: formData.endDate ? new Date(formData.endDate) : null,
      assignees: formData.assignees.length > 0 ? formData.assignees : null,
      teamMembers: formData.teamMembers.length > 0 ? formData.teamMembers : null,
      tags: formData.tags.length > 0 ? formData.tags : null,
    };

    try {
      await updateProjectMutation.mutateAsync(updateData);
      await updateProjectApplicationsMutation.mutateAsync(selectedApplications);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const addAssignee = () => {
    if (newAssignee.trim() && !formData.assignees.includes(newAssignee.trim())) {
      setFormData(prev => ({
        ...prev,
        assignees: [...prev.assignees, newAssignee.trim()]
      }));
      setNewAssignee("");
    }
  };

  const removeAssignee = (assignee: string) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.filter(a => a !== assignee)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const toggleApplication = (applicationId: number) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const colorOptions = [
    { value: "blue", label: "Blue", color: "bg-blue-500" },
    { value: "green", label: "Green", color: "bg-green-500" },
    { value: "purple", label: "Purple", color: "bg-purple-500" },
    { value: "red", label: "Red", color: "bg-red-500" },
    { value: "yellow", label: "Yellow", color: "bg-yellow-500" },
    { value: "indigo", label: "Indigo", color: "bg-indigo-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${color.color}`} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Applications Configuration */}
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Configured Applications
                </Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`app-${app.id}`}
                        checked={selectedApplications.includes(app.id)}
                        onCheckedChange={() => toggleApplication(app.id)}
                      />
                      <Label 
                        htmlFor={`app-${app.id}`} 
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: app.color || "#10b981" }}
                        />
                        <span className="flex-1">{app.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {app.type}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {selectedApplications.length} application(s)
                </p>
              </div>

              {/* Team Members */}
              <div>
                <Label>Team Members</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add team member"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAssignee())}
                  />
                  <Button type="button" onClick={addAssignee} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.assignees.map((assignee) => (
                    <Badge key={assignee} variant="secondary" className="gap-1">
                      {assignee}
                      <button
                        type="button"
                        onClick={() => removeAssignee(assignee)}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateProjectMutation.isPending || updateProjectApplicationsMutation.isPending}
            >
              {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}