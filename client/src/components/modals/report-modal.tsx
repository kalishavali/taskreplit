import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { BarChart3, FileText, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
}

interface ReportConfig {
  type: string;
  startDate: string;
  endDate: string;
  projectIds: number[];
  format: string;
}

export default function ReportModal({ isOpen, onClose, projects }: ReportModalProps) {
  const { toast } = useToast();
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: "task-summary",
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    projectIds: [],
    format: "pdf",
  });
  const [previewData, setPreviewData] = useState<any>(null);

  const generateReportMutation = useMutation({
    mutationFn: async (config: ReportConfig) => {
      const response = await apiRequest("/api/reports/generate", "POST", config);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Report generated successfully. ${data.tasks} tasks included.`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate report.",
        variant: "destructive",
      });
    },
  });

  const previewReportMutation = useMutation({
    mutationFn: async (config: ReportConfig) => {
      const response = await apiRequest("/api/reports/generate", "POST", config);
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate preview.",
        variant: "destructive",
      });
    },
  });

  const handleProjectToggle = (projectId: number, checked: boolean) => {
    setReportConfig(prev => ({
      ...prev,
      projectIds: checked 
        ? [...prev.projectIds, projectId]
        : prev.projectIds.filter(id => id !== projectId)
    }));
  };

  const reportTypes = [
    { value: "task-summary", label: "Task Summary" },
    { value: "project-progress", label: "Project Progress" },
    { value: "team-performance", label: "Team Performance" },
    { value: "time-tracking", label: "Time Tracking" },
  ];

  const formats = [
    { value: "pdf", label: "PDF" },
    { value: "excel", label: "Excel" },
    { value: "csv", label: "CSV" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Configuration */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Report Configuration</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select
                  value={reportConfig.type}
                  onValueChange={(value) => setReportConfig(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input
                    type="date"
                    value={reportConfig.startDate}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                  <Input
                    type="date"
                    value={reportConfig.endDate}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label>Projects</Label>
                <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={reportConfig.projectIds.includes(project.id)}
                        onCheckedChange={(checked) => 
                          handleProjectToggle(project.id, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`project-${project.id}`}
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {project.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="format">Export Format</Label>
                <Select
                  value={reportConfig.format}
                  onValueChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Report Preview */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Report Preview</h4>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
              {previewData ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-primary mx-auto mb-2" />
                    <h5 className="font-semibold">{reportTypes.find(t => t.value === previewData.type)?.label}</h5>
                    <p className="text-sm text-gray-600">
                      {new Date(previewData.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{previewData.tasks}</div>
                      <div className="text-xs text-gray-500">Total Tasks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{previewData.completed}</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{previewData.inProgress}</div>
                      <div className="text-xs text-gray-500">In Progress</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-600">{previewData.todo}</div>
                      <div className="text-xs text-gray-500">To Do</div>
                    </div>
                  </div>

                  {Object.keys(previewData.tasksByProject).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h6 className="font-medium mb-2">Tasks by Project</h6>
                        {Object.entries(previewData.tasksByProject).map(([projectName, data]: [string, any]) => (
                          <div key={projectName} className="flex justify-between items-center py-1">
                            <span className="text-sm">{projectName}</span>
                            <span className="text-sm font-medium">{data.total} tasks</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-600 mt-20">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Report preview will appear here</p>
                  <p className="text-sm">Click "Preview" to see report data</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => previewReportMutation.mutate(reportConfig)}
            disabled={previewReportMutation.isPending}
          >
            {previewReportMutation.isPending ? "Loading..." : "Preview"}
          </Button>
          <Button 
            type="button"
            onClick={() => generateReportMutation.mutate(reportConfig)}
            disabled={generateReportMutation.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
