import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, FolderOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertApplicationSchema, type Application, type Project } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface ApplicationsPanelProps {
  projects: Project[];
  selectedProjectIds: number[];
  onProjectSelectionChange: (projectIds: number[]) => void;
}

export function ApplicationsPanel({ 
  projects, 
  selectedProjectIds, 
  onProjectSelectionChange 
}: ApplicationsPanelProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      type: "Web",
      color: "#3b82f6",
      status: "active",
    },
  });

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const createApplicationMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/applications", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Application created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating application", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const linkApplicationsMutation = useMutation({
    mutationFn: async ({ projectId, applicationIds }: { projectId: number; applicationIds: number[] }) => {
      return apiRequest(`/api/projects/${projectId}/applications`, "POST", { applicationIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Applications linked successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error linking applications", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredApplications = (applications as Application[]).filter((app: Application) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectSelection = (projectId: number, isSelected: boolean) => {
    if (isSelected) {
      onProjectSelectionChange([...selectedProjectIds, projectId]);
    } else {
      onProjectSelectionChange(selectedProjectIds.filter(id => id !== projectId));
    }
  };

  const handleLinkApplications = async () => {
    if (selectedProjectIds.length === 0) {
      toast({ 
        title: "No projects selected", 
        description: "Please select at least one project",
        variant: "destructive" 
      });
      return;
    }

    // For now, we'll link all applications to selected projects
    // In a real implementation, you might want to show a dialog to select specific applications
    const allApplicationIds = (applications as Application[]).map((app: Application) => app.id);
    
    try {
      for (const projectId of selectedProjectIds) {
        await linkApplicationsMutation.mutateAsync({ 
          projectId, 
          applicationIds: allApplicationIds 
        });
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Applications</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Application</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createApplicationMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Application name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <FormControl>
                          <Input placeholder="Icon (emoji or URL)" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Web">Web</SelectItem>
                            <SelectItem value="Mobile">Mobile</SelectItem>
                            <SelectItem value="Watch">Watch</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createApplicationMutation.isPending}
                    >
                      Create
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchQuery ? "No applications found" : "No applications yet"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app: Application) => (
              <div key={app.id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-lg">{app.icon || "📱"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {app.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {app.type} • {app.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects Selection */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Link to Projects</h3>
          <Button
            size="sm"
            onClick={handleLinkApplications}
            disabled={selectedProjectIds.length === 0 || linkApplicationsMutation.isPending}
            className="h-8"
          >
            <FolderOpen className="h-4 w-4 mr-1" />
            Link
          </Button>
        </div>

        <div className="space-y-2 max-h-32 overflow-y-auto">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center space-x-2">
              <Checkbox
                id={`project-${project.id}`}
                checked={selectedProjectIds.includes(project.id)}
                onCheckedChange={(checked) => 
                  handleProjectSelection(project.id, checked as boolean)
                }
              />
              <label
                htmlFor={`project-${project.id}`}
                className="text-sm text-gray-700 cursor-pointer flex-1 truncate"
              >
                {project.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}