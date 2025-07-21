import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import ReportModal from "@/components/modals/report-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Download, BarChart3, PieChart, TrendingUp } from "lucide-react";
import type { Project } from "@shared/schema";

interface Stats {
  totalTasks: number;
  totalProjects: number;
  todoTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export default function Reports() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const reportTemplates = [
    {
      id: 1,
      name: "Task Summary Report",
      description: "Overview of all tasks with status breakdown",
      type: "task-summary",
      icon: BarChart3,
      lastGenerated: "2 days ago",
      status: "Recent",
    },
    {
      id: 2,
      name: "Project Progress Report",
      description: "Detailed progress tracking for all projects",
      type: "project-progress",
      icon: TrendingUp,
      lastGenerated: "1 week ago",
      status: "Outdated",
    },
    {
      id: 3,
      name: "Team Performance Report",
      description: "Individual and team productivity metrics",
      type: "team-performance",
      icon: PieChart,
      lastGenerated: "3 days ago",
      status: "Recent",
    },
  ];

  return (
    <>
      <Header 
        title="Reports" 
        subtitle="Generate and manage project reports"
        action={
          <Button onClick={() => setIsReportModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        }
      />
      
      <main className="flex-1 overflow-auto p-6">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inProgressTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <PieChart className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overdueTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Templates */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary-100 rounded-lg">
                            <Icon className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                          </div>
                        </div>
                        <Badge variant={template.status === "Recent" ? "default" : "secondary"}>
                          {template.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Last generated: {template.lastGenerated}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => setIsReportModalOpen(true)}
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Recent Reports */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {[
                    { name: "Weekly Task Summary", date: "Dec 12, 2024", type: "PDF", size: "2.4 MB" },
                    { name: "Project Progress Q4", date: "Dec 10, 2024", type: "Excel", size: "1.8 MB" },
                    { name: "Team Performance Nov", date: "Dec 8, 2024", type: "PDF", size: "3.1 MB" },
                  ].map((report, index) => (
                    <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded">
                          <FileText className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{report.name}</p>
                          <p className="text-sm text-muted-foreground">{report.date} • {report.type} • {report.size}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        projects={projects}
      />
    </>
  );
}
