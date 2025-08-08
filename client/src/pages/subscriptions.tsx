import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Search, Trash2, Edit, Calendar, AlertTriangle, TrendingUp, DollarSign, RefreshCw, Smartphone, Monitor, Cloud, Music, Film, Database, Code, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import SubscriptionCreateModal from "@/components/subscription-modal/subscription-create-modal-simple";
import SubscriptionEditModal from "@/components/subscription-modal/subscription-edit-modal";
import type { Subscription } from "@shared/schema";

const categoryIcons = {
  streaming: Film,
  cloud: Cloud,
  software: Code,
  database: Database,
  productivity: Monitor,
  social: Smartphone,
  music: Music,
  payment: CreditCard,
  general: RefreshCw,
};

const categoryLabels = {
  streaming: "Streaming",
  cloud: "Cloud Services",
  software: "Software",
  database: "Database",
  productivity: "Productivity",
  social: "Social Media",
  music: "Music",
  payment: "Payment",
  general: "General",
};

const frequencyLabels = {
  daily: "Daily",
  monthly: "Monthly",
  yearly: "Yearly",
  "data-based": "Data-based",
};

const statusColors = {
  active: "bg-green-100 text-green-800",
  expiring_soon: "bg-orange-100 text-orange-800",
  expired: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-800",
};

export default function Subscriptions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFrequency, setSelectedFrequency] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editSubscription, setEditSubscription] = useState<Subscription | null>(null);
  const { toast } = useToast();

  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/subscriptions-stats"],
  });

  // Helper functions
  const getRenewalStatus = (subscription: Subscription) => {
    if (!subscription.isActive) return "inactive";
    if (!subscription.nextRenewalDate) return "active";
    
    const now = new Date();
    const renewalDate = new Date(subscription.nextRenewalDate);
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilRenewal < 0) return "expired";
    if (daysUntilRenewal <= 7) return "expiring_soon";
    return "active";
  };

  const getDaysUntilRenewal = (subscription: Subscription) => {
    if (!subscription.nextRenewalDate) return null;
    const now = new Date();
    const renewalDate = new Date(subscription.nextRenewalDate);
    const days = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "expiring_soon": return "Expiring Soon";
      case "expired": return "Expired";
      case "inactive": return "Inactive";
      default: return "Active";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      await apiRequest(`/api/subscriptions/${subscriptionId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions-stats"] });
      toast({
        title: "Subscription deleted",
        description: "Subscription has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const matchesSearch = subscription.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (subscription.description && subscription.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || subscription.category === selectedCategory;
    const matchesFrequency = selectedFrequency === "all" || subscription.frequency === selectedFrequency;
    return matchesSearch && matchesCategory && matchesFrequency;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/95 via-purple-600/95 to-indigo-600/95 backdrop-blur-xl border border-white/20 p-8 mb-8">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <RefreshCw className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                    Subscription Management
                  </h1>
                  <p className="text-blue-100 mt-1">Track and manage all your service subscriptions</p>
                </div>
              </div>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                data-testid="button-create-subscription"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subscription
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-gray-600">Active Subscriptions</CardDescription>
                    <CardTitle className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                      {stats.totalActive}
                    </CardTitle>
                  </div>
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-gray-600">Monthly Cost</CardDescription>
                    <CardTitle className="text-2xl font-bold text-green-600" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                      {formatCurrency(stats.totalCost, "USD")}
                    </CardTitle>
                  </div>
                  <div className="p-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-gray-600">Expiring Soon</CardDescription>
                    <CardTitle className="text-2xl font-bold text-orange-600" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                      {stats.expiringSoon}
                    </CardTitle>
                  </div>
                  <div className="p-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-gray-600">Categories</CardDescription>
                    <CardTitle className="text-2xl font-bold text-purple-600" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                      {Object.keys(stats.categories).length}
                    </CardTitle>
                  </div>
                  <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8 bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              Filter Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search subscriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/50 border-white/20 focus:border-blue-300 transition-colors"
                  data-testid="input-search"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white/50 border-white/20" data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                <SelectTrigger className="bg-white/50 border-white/20" data-testid="select-frequency">
                  <SelectValue placeholder="All Frequencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frequencies</SelectItem>
                  {Object.entries(frequencyLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Grid */}
        {filteredSubscriptions.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                No subscriptions found
              </h3>
              <p className="text-gray-500 mb-6">Get started by adding your first subscription</p>
              {subscriptions.length === 0 && (
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  data-testid="button-create-first-subscription"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Subscription
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubscriptions.map((subscription) => {
              const CategoryIcon = categoryIcons[subscription.category as keyof typeof categoryIcons] || RefreshCw;
              const renewalStatus = getRenewalStatus(subscription);
              const daysUntilRenewal = getDaysUntilRenewal(subscription);
              const isExpiringSoon = daysUntilRenewal !== null && daysUntilRenewal <= 7 && daysUntilRenewal > 0;

              return (
                <Card
                  key={subscription.id}
                  className="group bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                  data-testid={`card-subscription-${subscription.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                          <CategoryIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                            {subscription.name}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[subscription.category as keyof typeof categoryLabels] || "General"}
                            </Badge>
                            <Badge className={`text-xs ${statusColors[renewalStatus as keyof typeof statusColors]}`}>
                              {getStatusLabel(renewalStatus)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditSubscription(subscription)}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                          data-testid={`button-edit-${subscription.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-100"
                              data-testid={`button-delete-${subscription.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-white/20">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{subscription.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white/50 border-white/20 hover:bg-white/70">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSubscriptionMutation.mutate(subscription.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {subscription.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{subscription.description}</p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Cost:</span>
                        <span className="font-medium text-green-600" data-testid={`text-cost-${subscription.id}`}>
                          {formatCurrency(parseFloat(subscription.cost), subscription.currency)}
                          <span className="text-xs text-gray-500 ml-1">/{subscription.frequency}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Start Date:</span>
                        <span className="font-medium" data-testid={`text-start-date-${subscription.id}`}>
                          {formatDate(subscription.startDate)}
                        </span>
                      </div>

                      {subscription.nextRenewalDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Next Renewal:</span>
                          <div className="flex items-center space-x-2">
                            {isExpiringSoon && (
                              <AlertTriangle className="w-3 h-3 text-orange-500" />
                            )}
                            <span className={`font-medium ${isExpiringSoon ? 'text-orange-600' : 'text-gray-900'}`} 
                                  data-testid={`text-next-renewal-${subscription.id}`}>
                              {formatDate(subscription.nextRenewalDate)}
                            </span>
                          </div>
                        </div>
                      )}

                      {daysUntilRenewal !== null && daysUntilRenewal > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Days Until Renewal:</span>
                          <span className={`font-medium ${daysUntilRenewal <= 7 ? 'text-orange-600' : 'text-gray-900'}`} 
                                data-testid={`text-days-until-renewal-${subscription.id}`}>
                            {daysUntilRenewal} days
                          </span>
                        </div>
                      )}
                    </div>

                    {isExpiringSoon && (
                      <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-orange-700">Renewing soon!</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Floating decorative elements */}
        <div className="fixed top-20 right-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
        <div className="fixed bottom-20 left-10 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-pulse delay-1000 pointer-events-none"></div>
      </div>

      {/* Modals */}
      <SubscriptionCreateModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
      
      {editSubscription && (
        <SubscriptionEditModal
          open={!!editSubscription}
          onOpenChange={() => setEditSubscription(null)}
          subscription={editSubscription}
        />
      )}
    </div>
  );
}