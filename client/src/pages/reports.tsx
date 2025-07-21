import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Download, BarChart3, PieChart, TrendingUp, Calendar, Users, Target, Activity } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell,
  Legend
} from "recharts";
import type { Project, Task, Application, TeamMember } from "@shared/schema";

interface Stats {
  totalTasks: number;
  totalProjects: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  blockedTasks: number;
  totalTimeLogged: number;
  activeTeamMembers: number;
  unreadNotifications: number;
}

export default function Reports() {
  const [selectedReportType, setSelectedReportType] = useState("overview");
  const [selectedDateRange, setSelectedDateRange] = useState("7d");
  const [selectedProject, setSelectedProject] = useState("all");

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  // Chart data processing
  const projectTasksData = projects.map(project => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    return {
      name: project.name,
      Open: projectTasks.filter(t => t.status === 'Open').length,
      InProgress: projectTasks.filter(t => t.status === 'InProgress').length,
      Blocked: projectTasks.filter(t => t.status === 'Blocked').length,
      Closed: projectTasks.filter(t => t.status === 'Closed').length,
      total: projectTasks.length,
    };
  });

  const applicationTasksData = applications.map(app => {
    const appTasks = tasks.filter(task => task.applicationId === app.id);
    return {
      name: app.name,
      Open: appTasks.filter(t => t.status === 'Open').length,
      InProgress: appTasks.filter(t => t.status === 'InProgress').length,
      Blocked: appTasks.filter(t => t.status === 'Blocked').length,
      Closed: appTasks.filter(t => t.status === 'Closed').length,
      total: appTasks.length,
    };
  });

  const teamTasksData = teamMembers.map(member => {
    const memberTasks = tasks.filter(task => task.assignee === member.name);
    return {
      name: member.name,
      Open: memberTasks.filter(t => t.status === 'Open').length,
      InProgress: memberTasks.filter(t => t.status === 'InProgress').length,  
      Blocked: memberTasks.filter(t => t.status === 'Blocked').length,
      Closed: memberTasks.filter(t => t.status === 'Closed').length,
      total: memberTasks.length,
    };
  });

  const statusDistributionData = [
    { name: 'Open', value: tasks.filter(t => t.status === 'Open').length, color: '#9CA3AF' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'InProgress').length, color: '#F59E0B' },
    { name: 'Blocked', value: tasks.filter(t => t.status === 'Blocked').length, color: '#EF4444' },
    { name: 'Closed', value: tasks.filter(t => t.status === 'Closed').length, color: '#10B981' },
  ];

  const chartColors = {
    Open: '#9CA3AF',
    InProgress: '#F59E0B', 
    Blocked: '#EF4444',
    Closed: '#10B981'
  };

  const generateReport = () => {
    // Generate charts based on selected type - no PDF creation
    console.log(`Generating ${selectedReportType} charts for ${selectedDateRange} period`);
  };

  const priorityData = [
    { name: 'High Priority', value: tasks.filter(t => t.priority === 'high').length, color: '#DC2626' },
    { name: 'Medium Priority', value: tasks.filter(t => t.priority === 'medium').length, color: '#D97706' },
    { name: 'Low Priority', value: tasks.filter(t => t.priority === 'low').length, color: '#059669' },
  ];

  const reportOptions = [
    {
      id: "overview",
      name: "Project Overview",
      description: "High-level metrics and task distribution",
      icon: BarChart3,
    },
    {
      id: "progress",
      name: "Progress Tracking",
      description: "Detailed progress across projects and teams",
      icon: TrendingUp,
    },
    {
      id: "performance",
      name: "Team Performance",
      description: "Individual and team productivity analysis",
      icon: Users,
    },
    {
      id: "priority",
      name: "Priority Analysis",
      description: "Task priority distribution and trends",
      icon: Target,
    },
  ];

  return (
    <>
      <Header 
        title="Analytics Dashboard" 
        subtitle="Interactive reports and data visualizations"
        action={
          <div className="flex items-center gap-2">
            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateReport} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Activity className="w-4 h-4 mr-2" />
              Generate Charts
            </Button>
          </div>
        }
      />
      
      <main className="flex-1 overflow-auto p-6">
        {/* Report Type Selection */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedReportType === option.id 
                      ? 'ring-2 ring-blue-500 shadow-md bg-gradient-to-br from-blue-50 to-purple-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedReportType(option.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        selectedReportType === option.id 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{option.name}</h3>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Total Tasks</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.totalTasks}</p>
                    <p className="text-xs text-blue-600 mt-1">+12% from last month</p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-full">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Open Tasks</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.todoTasks}</p>
                    <p className="text-xs text-gray-600 mt-1">-5% from last week</p>
                  </div>
                  <div className="p-3 bg-gray-500 rounded-full">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700 font-medium">In Progress</p>
                    <p className="text-3xl font-bold text-orange-900">{stats.inProgressTasks}</p>
                    <p className="text-xs text-orange-600 mt-1">+8% this week</p>
                  </div>
                  <div className="p-3 bg-orange-500 rounded-full">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 font-medium">Blocked</p>
                    <p className="text-3xl font-bold text-red-900">{stats.blockedTasks}</p>
                    <p className="text-xs text-red-600 mt-1">-2% from yesterday</p>
                  </div>
                  <div className="p-3 bg-red-500 rounded-full">
                    <PieChart className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tasks by Project Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Open Issues by Project</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectTasksData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Open" stackId="a" fill={chartColors.Open} />
                  <Bar dataKey="InProgress" stackId="a" fill={chartColors.InProgress} />
                  <Bar dataKey="Blocked" stackId="a" fill={chartColors.Blocked} />
                  <Bar dataKey="Closed" stackId="a" fill={chartColors.Closed} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Task Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={statusDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Charts Section with Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="applications">By Application</TabsTrigger>
              <TabsTrigger value="team">By Team Member</TabsTrigger>
              <TabsTrigger value="priority">By Priority</TabsTrigger>
            </TabsList>
            
            <TabsContent value="applications" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Tasks by Application
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={applicationTasksData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="Open" stackId="a" fill={chartColors.Open} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="InProgress" stackId="a" fill={chartColors.InProgress} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Blocked" stackId="a" fill={chartColors.Blocked} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Closed" stackId="a" fill={chartColors.Closed} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Application Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <RechartsPieChart>
                        <Pie
                          data={applicationTasksData.map(app => ({ 
                            name: app.name, 
                            value: app.total,
                            color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][applicationTasksData.indexOf(app) % 4]
                          }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {applicationTasksData.map((entry, index) => (
                            <Cell key={`app-cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={teamTasksData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: 'none', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' 
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="Open" stackId="a" fill={chartColors.Open} />
                      <Bar dataKey="InProgress" stackId="a" fill={chartColors.InProgress} />
                      <Bar dataKey="Blocked" stackId="a" fill={chartColors.Blocked} />
                      <Bar dataKey="Closed" stackId="a" fill={chartColors.Closed} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="priority" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Priority Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <RechartsPieChart>
                        <Pie
                          data={priorityData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`priority-cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Priority Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {priorityData.map((priority, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: priority.color }}
                            />
                            <span className="font-medium">{priority.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{priority.value}</div>
                            <div className="text-xs text-gray-500">
                              {((priority.value / tasks.length) * 100).toFixed(1)}% of total
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>


        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Generate Custom Reports</h3>
                  <p className="text-indigo-100">Create interactive charts and visualizations instantly</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={generateReport}
                    className="bg-white text-indigo-600 hover:bg-gray-100"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Generate Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
