import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TeamCreateModal } from "@/components/team-modal/team-create-modal";
import { TeamEditModal } from "@/components/team-modal/team-edit-modal";
import { TeamMemberCreateModal } from "@/components/team-member-modal/team-member-create-modal";
import { TeamMemberEditModal } from "@/components/team-member-modal/team-member-edit-modal";
import { type Team, type TeamMember } from "@shared/schema";
import { 
  Users, 
  UserPlus, 
  Settings, 
  Trash2, 
  Edit, 
  Crown,
  Mail,
  MapPin,
  Calendar,
  Shield,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TeamsPage() {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
  });

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ["/api/team-members"],
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/teams/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    },
  });

  const deleteTeamMemberMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/team-members/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({
        title: "Success",
        description: "Team member removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTeam = (id: number) => {
    deleteTeamMutation.mutate(id);
  };

  const handleDeleteTeamMember = (id: number) => {
    deleteTeamMemberMutation.mutate(id);
  };

  const getTeamMembers = (teamId: number | null) => {
    if (!teamId) return (teamMembers as TeamMember[]).filter(member => !member.teamId);
    return (teamMembers as TeamMember[]).filter(member => member.teamId === teamId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Team Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Organize your team into groups and manage team members
              </p>
            </div>
            <div className="flex space-x-3">
              <TeamMemberCreateModal />
              <TeamCreateModal />
            </div>
          </div>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <TabsTrigger value="teams" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              All Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-6">
            {teamsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(teams as Team[]).map((team: Team) => {
                  const teamMemberCount = getTeamMembers(team.id).length;
                  return (
                    <Card 
                      key={team.id} 
                      className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 cursor-pointer group"
                      onClick={() => setSelectedTeam(team.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: team.color || "#3B82F6" }}
                            >
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                {team.name}
                              </CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {teamMemberCount} member{teamMemberCount !== 1 ? 's' : ''}
                                </Badge>
                                {team.department && (
                                  <Badge variant="outline" className="text-xs">
                                    {team.department}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setEditingTeam(team);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Team
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTeam(team.id);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-gray-600 dark:text-gray-400 mb-4">
                          {team.description || "No description provided"}
                        </CardDescription>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Created {new Date(team.createdAt).toLocaleDateString()}
                          </div>
                          {team.isActive ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Team Members for Selected Team */}
            {selectedTeam && (
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      Team Members - {(teams as Team[]).find((t: Team) => t.id === selectedTeam)?.name}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTeam(null)}
                    >
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getTeamMembers(selectedTeam).map((member: TeamMember) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/50 dark:bg-gray-700/50">
                        <Avatar>
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {member.email}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {member.role}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTeamMember(member.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            {membersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <Card key={i} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(teamMembers as TeamMember[]).map((member: TeamMember) => {
                  const memberTeam = (teams as Team[]).find((t: Team) => t.id === member.teamId);
                  return (
                    <Card key={member.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 group">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={member.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {member.name}
                                {member.role === 'admin' && (
                                  <Crown className="w-4 h-4 ml-2 inline text-yellow-500" />
                                )}
                              </h3>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingMember(member)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Member
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteTeamMember(member.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove Member
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <Mail className="w-4 h-4 mr-2" />
                              {member.email}
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-3">
                              <Badge 
                                variant={member.role === 'admin' ? 'default' : 'secondary'}
                                className={member.role === 'admin' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                {member.role}
                              </Badge>
                              
                              {memberTeam && (
                                <Badge 
                                  variant="outline" 
                                  className="border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300"
                                >
                                  {memberTeam.name}
                                </Badge>
                              )}
                              
                              {member.department && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {member.department}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-4">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="w-3 h-3 mr-1 inline" />
                                Joined {new Date(member.createdAt).toLocaleDateString()}
                              </div>
                              <Badge 
                                variant={member.isActive ? 'default' : 'secondary'}
                                className={member.isActive ? 'bg-green-100 text-green-800 border-green-200' : ''}
                              >
                                {member.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Modals */}
        {editingTeam && (
          <TeamEditModal
            team={editingTeam}
            open={!!editingTeam}
            onOpenChange={(open) => !open && setEditingTeam(null)}
          />
        )}
        
        {editingMember && (
          <TeamMemberEditModal
            member={editingMember}
            open={!!editingMember}
            onOpenChange={(open) => !open && setEditingMember(null)}
          />
        )}
      </div>
    </div>
  );
}