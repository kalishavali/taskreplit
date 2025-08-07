import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MonitorSpeaker, Car, Gem, Smartphone } from "lucide-react";
import type { Product } from "@shared/schema";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  category: z.enum(["electronics", "vehicles", "jewellery", "gadgets"]),
  purchaseDate: z.string().optional(),
  cost: z.string().optional(),
  currency: z.string().default("INR"),
  warrantyYears: z.number().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductEditModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryLabels = {
  electronics: "Electronics",
  vehicles: "Cars/Bikes",
  jewellery: "Gold Jewellery",
  gadgets: "Mobile/Laptop/Watches",
};

export default function ProductEditModal({
  product,
  open,
  onOpenChange,
}: ProductEditModalProps) {
  const [categoryDetails, setCategoryDetails] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product.name,
      description: product.description || "",
      category: product.category,
      purchaseDate: product.purchaseDate || "",
      cost: product.cost || "",
      currency: product.currency || "INR",
      warrantyYears: product.warrantyYears || undefined,
    },
  });

  // Fetch product details when the modal opens
  const { data: productDetails } = useQuery({
    queryKey: ["/api/products", product.id],
    enabled: open,
  });

  useEffect(() => {
    if (productDetails?.details) {
      setCategoryDetails(productDetails.details);
    }
  }, [productDetails]);

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData & { details?: any }) => {
      return await apiRequest(`/api/products/${product.id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id] });
      toast({
        title: "Product updated",
        description: "Product has been successfully updated.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    const submitData = {
      ...data,
      cost: data.cost ? data.cost : undefined,
      purchaseDate: data.purchaseDate ? data.purchaseDate : undefined,
      warrantyYears: data.warrantyYears || undefined,
      details: Object.keys(categoryDetails).length > 0 ? categoryDetails : undefined,
    };
    updateProductMutation.mutate(submitData);
  };

  const renderCategoryFields = () => {
    switch (product.category) {
      case "electronics":
        return (
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <MonitorSpeaker className="w-4 h-4 mr-2 text-blue-600" />
                Electronics Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Input
                  placeholder="e.g., Laptop, TV, Refrigerator"
                  value={categoryDetails.type || ""}
                  onChange={(e) => setCategoryDetails(prev => ({ ...prev, type: e.target.value }))}
                  data-testid="input-electronics-type"
                />
              </div>
            </CardContent>
          </Card>
        );
      
      case "vehicles":
        return (
          <Card className="bg-green-50/50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Car className="w-4 h-4 mr-2 text-green-600" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Model</label>
                <Input
                  placeholder="e.g., Honda City"
                  value={categoryDetails.model || ""}
                  onChange={(e) => setCategoryDetails(prev => ({ ...prev, model: e.target.value }))}
                  data-testid="input-vehicle-model"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Registration Number</label>
                <Input
                  placeholder="e.g., MH01AB1234"
                  value={categoryDetails.registrationNumber || ""}
                  onChange={(e) => setCategoryDetails(prev => ({ ...prev, registrationNumber: e.target.value }))}
                  data-testid="input-registration-number"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Car Type</label>
                <Select
                  value={categoryDetails.carType || ""}
                  onValueChange={(value) => setCategoryDetails(prev => ({ ...prev, carType: value }))}
                >
                  <SelectTrigger data-testid="select-car-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hatchback">Hatchback</SelectItem>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="scooter">Scooter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <Input
                  placeholder="e.g., White"
                  value={categoryDetails.color || ""}
                  onChange={(e) => setCategoryDetails(prev => ({ ...prev, color: e.target.value }))}
                  data-testid="input-vehicle-color"
                />
              </div>
            </CardContent>
          </Card>
        );
      
      case "jewellery":
        return (
          <Card className="bg-yellow-50/50 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Gem className="w-4 h-4 mr-2 text-yellow-600" />
                Jewellery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={categoryDetails.type || ""}
                  onValueChange={(value) => setCategoryDetails(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger data-testid="select-jewellery-type">
                    <SelectValue placeholder="Select jewellery type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="diamond">Diamond</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Gold Rate (₹/gram)</label>
                  <Input
                    placeholder="5500"
                    value={categoryDetails.goldRate || ""}
                    onChange={(e) => setCategoryDetails(prev => ({ ...prev, goldRate: e.target.value }))}
                    data-testid="input-gold-rate"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Gold Cost (₹)</label>
                  <Input
                    placeholder="50000"
                    value={categoryDetails.goldCost || ""}
                    onChange={(e) => setCategoryDetails(prev => ({ ...prev, goldCost: e.target.value }))}
                    data-testid="input-gold-cost"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Making Cost (₹)</label>
                  <Input
                    placeholder="5000"
                    value={categoryDetails.makingCost || ""}
                    onChange={(e) => setCategoryDetails(prev => ({ ...prev, makingCost: e.target.value }))}
                    data-testid="input-making-cost"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CGST (%)</label>
                  <Input
                    placeholder="1.5"
                    value={categoryDetails.cgst || ""}
                    onChange={(e) => setCategoryDetails(prev => ({ ...prev, cgst: e.target.value }))}
                    data-testid="input-cgst"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">IGST (%)</label>
                  <Input
                    placeholder="3"
                    value={categoryDetails.igst || ""}
                    onChange={(e) => setCategoryDetails(prev => ({ ...prev, igst: e.target.value }))}
                    data-testid="input-igst"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">VAT (%)</label>
                  <Input
                    placeholder="1"
                    value={categoryDetails.vat || ""}
                    onChange={(e) => setCategoryDetails(prev => ({ ...prev, vat: e.target.value }))}
                    data-testid="input-vat"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Total Weight (grams)</label>
                  <Input
                    placeholder="10.5"
                    value={categoryDetails.totalWeight || ""}
                    onChange={(e) => setCategoryDetails(prev => ({ ...prev, totalWeight: e.target.value }))}
                    data-testid="input-total-weight"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Stone Weight (grams)</label>
                  <Input
                    placeholder="2.3"
                    value={categoryDetails.stoneWeight || ""}
                    onChange={(e) => setCategoryDetails(prev => ({ ...prev, stoneWeight: e.target.value }))}
                    data-testid="input-stone-weight"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Diamond Weight (carats)</label>
                  <Input
                    placeholder="0.5"
                    value={categoryDetails.diamondWeight || ""}
                    onChange={(e) => setCategoryDetails(prev => ({ ...prev, diamondWeight: e.target.value }))}
                    data-testid="input-diamond-weight"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case "gadgets":
        return (
          <Card className="bg-purple-50/50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Smartphone className="w-4 h-4 mr-2 text-purple-600" />
                Gadget Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Model</label>
                <Input
                  placeholder="e.g., iPhone 15 Pro"
                  value={categoryDetails.model || ""}
                  onChange={(e) => setCategoryDetails(prev => ({ ...prev, model: e.target.value }))}
                  data-testid="input-gadget-model"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Manufacturer</label>
                <Input
                  placeholder="e.g., Apple"
                  value={categoryDetails.manufacturer || ""}
                  onChange={(e) => setCategoryDetails(prev => ({ ...prev, manufacturer: e.target.value }))}
                  data-testid="input-manufacturer"
                />
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Quicksand', sans-serif" }}>
            Edit Product
          </DialogTitle>
          <DialogDescription>
            Update product information and warranty details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} data-testid="input-product-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="vehicles">Cars/Bikes</SelectItem>
                        <SelectItem value="jewellery">Gold Jewellery</SelectItem>
                        <SelectItem value="gadgets">Mobile/Laptop/Watches</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter product description"
                      className="resize-none"
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-purchase-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hide warranty field for jewellery */}
              {product.category !== "jewellery" && (
                <FormField
                  control={form.control}
                  name="warrantyYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty Years</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter warranty years"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                          data-testid="input-warranty-years"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter cost" {...field} data-testid="input-cost" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {renderCategoryFields()}

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProductMutation.isPending}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                data-testid="button-submit"
              >
                {updateProductMutation.isPending ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}