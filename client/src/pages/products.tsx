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
import { Plus, Search, Trash2, Edit, Package, Smartphone, Car, Gem, MonitorSpeaker, Calendar, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import ProductCreateModal from "@/components/product-modal/product-create-modal";
import ProductEditModal from "@/components/product-modal/product-edit-modal";
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
    const matchesStatus = selectedStatus === "all" || getWarrantyStatus(product) === selectedStatus;
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
              const isWarrantyExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

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
                            <Badge className={`text-xs ${statusColors[warrantyStatus as keyof typeof statusColors]}`}>
                              {getWarrantyStatusLabel(warrantyStatus)}
                            </Badge>
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
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-3" data-testid={`text-description-${product.id}`}>
                        {product.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      {product.purchaseDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Purchase Date:</span>
                          <span className="font-medium" data-testid={`text-purchase-date-${product.id}`}>
                            {formatDate(product.purchaseDate)}
                          </span>
                        </div>
                      )}
                      
                      {product.cost && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Cost:</span>
                          <span className="font-medium text-green-600" data-testid={`text-cost-${product.id}`}>
                            {formatCurrency(parseFloat(product.cost), product.currency)}
                          </span>
                        </div>
                      )}
                      
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
                      
                      {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Days Left:</span>
                          <span className={`font-medium ${isWarrantyExpiringSoon ? 'text-orange-600' : 'text-gray-900'}`}
                                data-testid={`text-warranty-days-${product.id}`}>
                            {daysUntilExpiry} days
                          </span>
                        </div>
                      )}
                    </div>

                    {isWarrantyExpiringSoon && (
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