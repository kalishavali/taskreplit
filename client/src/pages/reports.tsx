import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Target, 
  Activity, 
  Building2, 
  FolderOpen, 
  FileText,
  CheckCircle,
  Clock,
  UserCheck
} from "lucide-react";
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
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar
} from "recharts";
import type { Project, Task, Application, TeamMember, Client } from "@shared/schema";

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
  const [selectedDateRange, setSelectedDateRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

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

  // Enhanced Chart data processing with beautiful colors
  const brandColors = {
    primary: '#6366f1',
    secondary: '#8b5cf6', 
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    light: '#f1f5f9',
    dark: '#1e293b'
  };

  const chartColors = {
    Open: '#94a3b8',
    InProgress: '#f59e0b', 
    Blocked: '#ef4444',
    Closed: '#10b981'
  };

  // Clients data processing 
  const clientsData = clients.map(client => {
    const clientProjects = projects.filter(p => p.clientId === client.id);
    const clientTasks = tasks.filter(t => clientProjects.some(p => p.id === t.projectId));
    return {
      name: client.name,
      projects: clientProjects.length,
      tasks: clientTasks.length,
      completedTasks: clientTasks.filter(t => t.status === 'Closed').length,
      completion: clientTasks.length > 0 ? Math.round((clientTasks.filter(t => t.status === 'Closed').length / clientTasks.length) * 100) : 0
    };
  });

  // Projects data with enhanced metrics
  const projectsData = projects.map(project => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    return {
      name: project.name.length > 12 ? project.name.substring(0, 12) + '...' : project.name,
      fullName: project.name,
      Open: projectTasks.filter(t => t.status === 'Open').length,
      InProgress: projectTasks.filter(t => t.status === 'InProgress').length,
      Blocked: projectTasks.filter(t => t.status === 'Blocked').length,
      Closed: projectTasks.filter(t => t.status === 'Closed').length,
      total: projectTasks.length,
      completion: projectTasks.length > 0 ? Math.round((projectTasks.filter(t => t.status === 'Closed').length / projectTasks.length) * 100) : 0
    };
  });

  // Applications data with enhanced visuals
  const applicationsData = applications.map(app => {
    const appTasks = tasks.filter(task => task.applicationId === app.id);
    return {
      name: app.name,
      icon: app.icon,
      type: app.type,
      Open: appTasks.filter(t => t.status === 'Open').length,
      InProgress: appTasks.filter(t => t.status === 'InProgress').length,
      Blocked: appTasks.filter(t => t.status === 'Blocked').length,
      Closed: appTasks.filter(t => t.status === 'Closed').length,
      total: appTasks.length,
      completion: appTasks.length > 0 ? Math.round((appTasks.filter(t => t.status === 'Closed').length / appTasks.length) * 100) : 0
    };
  });

  // Team performance data
  const teamData = teamMembers.map(member => {
    const memberTasks = tasks.filter(task => task.assignee === member.name);
    return {
      name: member.name,
      email: member.email,
      role: member.role,
      Open: memberTasks.filter(t => t.status === 'Open').length,
      InProgress: memberTasks.filter(t => t.status === 'InProgress').length,  
      Blocked: memberTasks.filter(t => t.status === 'Blocked').length,
      Closed: memberTasks.filter(t => t.status === 'Closed').length,
      total: memberTasks.length,
      productivity: memberTasks.length > 0 ? Math.round((memberTasks.filter(t => t.status === 'Closed').length / memberTasks.length) * 100) : 0
    };
  });

  // Status distribution for pie charts
  const statusDistributionData = [
    { name: 'Open', value: tasks.filter(t => t.status === 'Open').length, color: chartColors.Open, fill: chartColors.Open },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'InProgress').length, color: chartColors.InProgress, fill: chartColors.InProgress },
    { name: 'Blocked', value: tasks.filter(t => t.status === 'Blocked').length, color: chartColors.Blocked, fill: chartColors.Blocked },
    { name: 'Closed', value: tasks.filter(t => t.status === 'Closed').length, color: chartColors.Closed, fill: chartColors.Closed },
  ];

  // Priority analysis
  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#dc2626', fill: '#dc2626' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#d97706', fill: '#d97706' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#059669', fill: '#059669' },
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length, color: '#7c2d12', fill: '#7c2d12' },
  ];

  const generateReport = () => {
    console.log(`Generating overview charts for ${selectedDateRange} period`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header 
        title="Analytics Dashboard" 
        subtitle="Beautiful insights across Clients, Projects, Applications, and Teams"
        action={
          <div className="flex items-center gap-3">
            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="w-36 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={generateReport} 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Activity className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        }
      />
      
      <main className="flex-1 overflow-auto p-6 space-y-8">
        
        {/* Beautiful Statistics Overview Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-700 font-semibold tracking-wide">TOTAL TASKS</p>
                    <p className="text-4xl font-bold text-indigo-900 mt-2">{stats.totalTasks}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <p className="text-sm text-green-600 ml-1">+12% from last month</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-700 font-semibold tracking-wide">OPEN TASKS</p>
                    <p className="text-4xl font-bold text-slate-900 mt-2">{stats.todoTasks}</p>
                    <div className="flex items-center mt-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <p className="text-sm text-amber-600 ml-1">Needs attention</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl shadow-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700 font-semibold tracking-wide">IN PROGRESS</p>
                    <p className="text-4xl font-bold text-amber-900 mt-2">{stats.inProgressTasks}</p>
                    <div className="flex items-center mt-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <p className="text-sm text-blue-600 ml-1">+8% this week</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-semibold tracking-wide">COMPLETED</p>
                    <p className="text-4xl font-bold text-green-900 mt-2">{stats.doneTasks}</p>
                    <div className="flex items-center mt-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <p className="text-sm text-green-600 ml-1">Great progress!</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Beautiful Tabbed Charts */}
        <div className="mt-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm border-0 shadow-lg h-14">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold"
              >
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="clients" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white font-semibold"
              >
                <Building2 className="w-4 h-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger 
                value="projects" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-600 data-[state=active]:text-white font-semibold"
              >
                <FolderOpen className="w-4 h-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger 
                value="team" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white font-semibold"
              >
                <Users className="w-4 h-4" />
                Team
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab Content */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Status Distribution */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Task Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={statusDistributionData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {statusDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' 
                          }} 
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Priority Distribution */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Priority Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={priorityData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={100}
                          paddingAngle={5}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' 
                          }} 
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Clients Tab Content */}
            <TabsContent value="clients" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Performance Chart */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Client Project Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={clientsData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="projects" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Projects" />
                        <Bar dataKey="tasks" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Total Tasks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Client Completion Rates */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-teal-500 to-green-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Client Completion Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <RadialBarChart data={clientsData} innerRadius="20%" outerRadius="90%">
                        <RadialBar 
                          dataKey="completion" 
                          cornerRadius={10} 
                          fill="#10b981"
                          label={{ position: 'insideStart', fill: '#fff' }}
                        />
                        <Legend 
                          iconSize={18}
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' 
                          }} 
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Projects Tab Content */}
            <TabsContent value="projects" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Tasks Chart */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5" />
                      Tasks by Project
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={projectsData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="Open" stackId="a" fill={chartColors.Open} name="Open" />
                        <Bar dataKey="InProgress" stackId="a" fill={chartColors.InProgress} name="In Progress" />
                        <Bar dataKey="Blocked" stackId="a" fill={chartColors.Blocked} name="Blocked" />
                        <Bar dataKey="Closed" stackId="a" fill={chartColors.Closed} name="Completed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Project Completion Trend */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Project Completion Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={projectsData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' 
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="completion" 
                          stroke="#10b981" 
                          fill="url(#colorCompletion)" 
                          strokeWidth={3}
                        />
                        <defs>
                          <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Team Tab Content */}
            <TabsContent value="team" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Performance */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Team Task Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={teamData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="Open" stackId="a" fill={chartColors.Open} name="Open" />
                        <Bar dataKey="InProgress" stackId="a" fill={chartColors.InProgress} name="In Progress" />
                        <Bar dataKey="Blocked" stackId="a" fill={chartColors.Blocked} name="Blocked" />
                        <Bar dataKey="Closed" stackId="a" fill={chartColors.Closed} name="Completed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Team Productivity */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Team Productivity Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={teamData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' 
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="productivity" 
                          stroke="#ec4899" 
                          strokeWidth={4}
                          dot={{ fill: '#ec4899', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: '#ec4899', strokeWidth: 2, fill: '#fff' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
