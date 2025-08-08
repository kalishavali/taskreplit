import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const categories = [
  { value: "streaming", label: "Streaming" },
  { value: "cloud", label: "Cloud Services" },
  { value: "software", label: "Software" },
  { value: "database", label: "Database" },
  { value: "productivity", label: "Productivity" },
  { value: "social", label: "Social Media" },
  { value: "music", label: "Music" },
  { value: "payment", label: "Payment" },
  { value: "general", label: "General" },
];

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "data-based", label: "Data-based" },
  { value: "next-date", label: "Next Date" },
];

const currencies = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "INR", label: "INR" },
];

interface SubscriptionCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubscriptionCreateModal({ open, onOpenChange }: SubscriptionCreateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      cost: "",
      currency: "USD",
      frequency: "monthly",
      startDate: new Date().toISOString().split('T')[0],
      nextRenewalDate: "",
      nextPaymentAmount: "",
      useCustomAmount: false,
      description: "",
      category: "general",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Transform data for API
      const payload = {
        ...data,
        cost: parseFloat(data.cost),
        startDate: new Date(data.startDate),
        nextRenewalDate: data.nextRenewalDate ? new Date(data.nextRenewalDate) : null,
        nextPaymentAmount: data.nextPaymentAmount ? parseFloat(data.nextPaymentAmount) : null,
      };
      return await apiRequest("/api/subscriptions", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions-stats"] });
      toast({
        title: "Subscription created",
        description: "New subscription has been added successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating subscription",
        description: error.message || "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    createMutation.mutate(data);
  };

  const watchedFrequency = form.watch("frequency");
  const watchedCost = form.watch("cost");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            Add New Subscription
          </DialogTitle>
          <DialogDescription>
            Add a new subscription to track costs and payment schedules. Use "Next Date" for services that give you specific amounts and dates for future payments.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Netflix, AWS, Adobe Creative..."
                        {...field}
                        className="bg-white/50 border-white/20 focus:border-blue-300"
                        data-testid="input-name"
                      />
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
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/50 border-white/20" data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Payment Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="25.00"
                        {...field}
                        className="bg-white/50 border-white/20 focus:border-blue-300"
                        data-testid="input-cost"
                      />
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
                        <SelectTrigger className="bg-white/50 border-white/20" data-testid="select-currency">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency *</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "next-date") {
                        form.setValue("nextRenewalDate", "");
                        form.setValue("useCustomAmount", false);
                        form.setValue("nextPaymentAmount", "");
                        setShowCustomAmount(false);
                      }
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/50 border-white/20" data-testid="select-frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {frequencies.map((frequency) => (
                          <SelectItem key={frequency.value} value={frequency.value}>
                            {frequency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="bg-white/50 border-white/20 focus:border-blue-300"
                        data-testid="input-start-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Next Payment Date - only shown for "next-date" frequency */}
              {watchedFrequency === "next-date" && (
                <FormField
                  control={form.control}
                  name="nextRenewalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Payment Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="bg-white/50 border-white/20 focus:border-blue-300"
                          data-testid="input-next-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Next Payment Details - only shown for "next-date" frequency */}
            {watchedFrequency === "next-date" && (
              <div className="space-y-4 p-4 bg-blue-50/30 rounded-lg border border-blue-200/50">
                <h4 className="font-medium text-gray-800">Next Payment Details</h4>
                <p className="text-sm text-gray-600">
                  Use this for services that tell you a specific amount to pay on a specific future date 
                  (e.g., "Pay $50 on August 25th")
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nextPaymentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Payment Amount *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="50.00"
                            {...field}
                            className="bg-white/50 border-white/20 focus:border-blue-300"
                            data-testid="input-next-payment-amount"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500 mt-1">
                          Amount they told you to pay on the next date
                        </p>
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col justify-center">
                    <p className="text-sm font-medium text-gray-700">Payment Timeline:</p>
                    <p className="text-xs text-gray-600">
                      Initial: ${watchedCost || "0.00"} (already paid)
                    </p>
                    <p className="text-xs text-gray-600">
                      Next: ${form.watch("nextPaymentAmount") || "0.00"} (upcoming)
                    </p>
                  </div>
                </div>

                {/* Option to mark as custom schedule */}
                <FormField
                  control={form.control}
                  name="useCustomAmount"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-4 h-4"
                          data-testid="checkbox-custom-schedule"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        This service has irregular payment amounts/schedules
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description or notes..."
                      className="bg-white/50 border-white/20 focus:border-blue-300 min-h-[80px]"
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-white/50 border-white/20 hover:bg-white/70"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                data-testid="button-create"
              >
                {isSubmitting ? "Creating..." : "Create Subscription"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}