import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Trash2, Edit, Package, Smartphone, Car, Gem, MonitorSpeaker, Calendar, AlertTriangle, TrendingUp, DollarSign, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import ProductCreateModal from "@/components/product-modal/product-create-modal";
import ProductEditModal from "@/components/product-modal/product-edit-modal";
import { usePreciousMetalRates } from "@/hooks/usePreciousMetalRates";
import type { Product } from "@shared/schema";

const categoryIcons = {
  electronics: MonitorSpeaker,
  vehicles: Car,
  jewellery: Gem,
  gadgets: Smartphone,
};

const categoryLabels = {
  electronics: "Electronics",
  vehicles: "Cars/Bikes",
  jewellery: "Gold Jewellery",
  gadgets: "Mobile/Laptop/Watches",
};

const statusColors = {
  under_warranty: "bg-green-100 text-green-800",
  warranty_expired: "bg-red-100 text-red-800",
  no_warranty: "bg-gray-100 text-gray-800",
};

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const metalRates = usePreciousMetalRates();

  // Helper functions defined first to avoid hoisting issues
  const getWarrantyStatus = (product: Product) => {
    if (!product.warrantyExpiryDate) return "no_warranty";
    const now = new Date();
    const expiryDate = new Date(product.warrantyExpiryDate);
    return expiryDate > now ? "under_warranty" : "warranty_expired";
  };

  const getWarrantyStatusLabel = (status: string) => {
    switch (status) {
      case "under_warranty": return "Under Warranty";
      case "warranty_expired": return "Warranty Expired";
      default: return "No Warranty";
    }
  };

  const getDaysUntilExpiry = (product: Product) => {
    if (!product.warrantyExpiryDate) return null;
    const now = new Date();
    const expiryDate = new Date(product.warrantyExpiryDate);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest(`/api/products/${productId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "Product has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    // Only apply warranty status filtering for electronics products
    const matchesStatus = selectedStatus === "all" || 
                         (product.category === "electronics" && getWarrantyStatus(product) === selectedStatus) ||
                         (product.category !== "electronics");
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/95 via-purple-600/95 to-indigo-600/95 backdrop-blur-xl border border-white/20 p-8 mb-8">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                    Product Registration
                  </h1>
                  <p className="text-blue-100 mt-1">Track your valuable items with warranty management</p>
                </div>
              </div>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                data-testid="button-create-product"
              >
                <Plus className="w-4 h-4 mr-2" />
                Register Product
              </Button>
            </div>
          </div>
          {/* Floating animation elements */}
          <div className="absolute top-4 right-20 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-8 left-20 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        {/* Precious Metal Rates */}
        <Card className="mb-6 bg-white/80 backdrop-blur-xl border border-white/30 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-yellow-600" />
                Live Precious Metal Rates
              </div>
              <div className="flex items-center space-x-2">
                {metalRates.isLoading && (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                )}
                <span className="text-xs text-gray-500 font-normal">
                  {metalRates.isLoading ? 'Updating...' : 'Live'}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {metalRates.error && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  {metalRates.error}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gold Rates */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <Gem className="w-4 h-4 mr-2 text-yellow-500" />
                  Gold Rates (per gram)
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <span className="font-medium text-yellow-800">24K Gold</span>
                    <span className="font-bold text-yellow-900">₹{metalRates.gold24k.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <span className="font-medium text-yellow-800">22K Gold</span>
                    <span className="font-bold text-yellow-900">₹{metalRates.gold22k.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <span className="font-medium text-yellow-800">18K Gold</span>
                    <span className="font-bold text-yellow-900">₹{metalRates.gold18k.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Silver Rate */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                  Silver Rate
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-800">Silver (per gram)</span>
                    <span className="font-bold text-gray-900">₹{metalRates.silver.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-800">Silver (per kg)</span>
                    <span className="font-bold text-gray-900">₹{(metalRates.silver * 1000).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-center p-2">
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                      {new Date().getHours() >= 9 && new Date().getHours() <= 17 
                        ? '🟢 Market Active' 
                        : '🟡 After Hours'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Diamond Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <Gem className="w-4 h-4 mr-2 text-blue-500" />
                  Diamond Rates
                </h4>
                <div className="space-y-2">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <p className="font-medium text-blue-800 mb-2">Variable by 4Cs</p>
                      <p className="text-sm text-blue-700">Cut, Clarity, Carat, Color</p>
                      <p className="text-xs text-blue-600 mt-2">Quoted per carat based on stone specifications</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Last updated: {new Date(metalRates.lastUpdated).toLocaleString('en-IN')}. 
                Actual prices may vary by jeweler due to making charges and taxes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6 bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/70 border-white/30"
                    data-testid="input-search"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] bg-white/70 border-white/30" data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="vehicles">Cars/Bikes</SelectItem>
                  <SelectItem value="jewellery">Gold Jewellery</SelectItem>
                  <SelectItem value="gadgets">Mobile/Laptop/Watches</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px] bg-white/70 border-white/30" data-testid="select-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="under_warranty">Under Warranty</SelectItem>
                  <SelectItem value="warranty_expired">Warranty Expired</SelectItem>
                  <SelectItem value="no_warranty">No Warranty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || selectedCategory !== "all" || selectedStatus !== "all"
                  ? "Try adjusting your filters to see more products."
                  : "Get started by registering your first product."}
              </p>
              {!searchQuery && selectedCategory === "all" && selectedStatus === "all" && (
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  data-testid="button-create-first-product"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Register Your First Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const CategoryIcon = categoryIcons[product.category as keyof typeof categoryIcons] || Package;
              const warrantyStatus = getWarrantyStatus(product);
              const daysUntilExpiry = getDaysUntilExpiry(product);
              // Only calculate warranty expiry warning for electronics
              const isWarrantyExpiringSoon = product.category === 'electronics' && 
                                          daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

              return (
                <Card
                  key={product.id}
                  className="group bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                  data-testid={`card-product-${product.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                          <CategoryIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                            {product.name}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[product.category as keyof typeof categoryLabels]}
                            </Badge>
                            {/* Only show warranty status for electronics */}
                            {product.category === 'electronics' && (
                              <Badge className={`text-xs ${statusColors[warrantyStatus as keyof typeof statusColors]}`}>
                                {getWarrantyStatusLabel(warrantyStatus)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditProduct(product)}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                          data-testid={`button-edit-${product.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-100"
                              data-testid={`button-delete-${product.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProductMutation.mutate(product.id)}
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
                  <CardContent className="pt-0">
                    {product.notes && (
                      <p className="text-gray-600 text-sm mb-3" data-testid={`text-description-${product.id}`}>
                        {product.notes}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      {/* Common fields - Purchase Date and Cost */}
                      {product.purchaseDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Purchase Date:</span>
                          <span className="font-medium" data-testid={`text-purchase-date-${product.id}`}>
                            {formatDate(product.purchaseDate)}
                          </span>
                        </div>
                      )}
                      
                      {product.totalCost && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Cost:</span>
                          <span className="font-medium text-green-600" data-testid={`text-cost-${product.id}`}>
                            {formatCurrency(parseFloat(product.totalCost), product.currency || "INR")}
                          </span>
                        </div>
                      )}
                      
                      {/* Category-specific fields */}
                      {product.category === "electronics" && (
                        <>
                          {product.warrantyExpiryDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Warranty Until:</span>
                              <div className="flex items-center space-x-2">
                                {isWarrantyExpiringSoon && (
                                  <AlertTriangle className="w-3 h-3 text-orange-500" />
                                )}
                                <span className={`font-medium ${isWarrantyExpiringSoon ? 'text-orange-600' : 'text-gray-900'}`} 
                                      data-testid={`text-warranty-expiry-${product.id}`}>
                                  {formatDate(product.warrantyExpiryDate)}
                                </span>
                              </div>
                            </div>
                          )}
                          {product.details?.registrationCode && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Registration Code:</span>
                              <span className="font-medium font-mono text-xs bg-gray-100 px-2 py-1 rounded" data-testid={`text-registration-code-${product.id}`}>
                                {product.details.registrationCode}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      
                      {product.category === "vehicles" && (
                        <>
                          {product.details?.model && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Model:</span>
                              <span className="font-medium" data-testid={`text-model-${product.id}`}>
                                {product.details.model}
                              </span>
                            </div>
                          )}
                          {product.details?.registrationNumber && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Registration No:</span>
                              <span className="font-medium font-mono text-xs bg-gray-100 px-2 py-1 rounded" data-testid={`text-registration-number-${product.id}`}>
                                {product.details.registrationNumber}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      
                      {product.category === "jewellery" && (
                        <>
                          {product.details?.ratePerUnit && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Gold Rate:</span>
                              <span className="font-medium text-yellow-600" data-testid={`text-gold-rate-${product.id}`}>
                                ₹{parseFloat(product.details.ratePerUnit).toLocaleString('en-IN')}/gram
                              </span>
                            </div>
                          )}
                          {product.details?.totalWeight && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Total Weight:</span>
                              <span className="font-medium" data-testid={`text-total-weight-${product.id}`}>
                                {parseFloat(product.details.totalWeight).toFixed(3)} grams
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {product.category === "electronics" && isWarrantyExpiringSoon && (
                      <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-orange-700">Warranty expires soon!</span>
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
      <ProductCreateModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
      
      {editProduct && (
        <ProductEditModal
          product={editProduct}
          open={!!editProduct}
          onOpenChange={(open) => !open && setEditProduct(null)}
        />
      )}
    </div>
  );
}