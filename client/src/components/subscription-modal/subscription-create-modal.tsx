import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertSubscriptionSchema } from "@shared/schema";

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

const createSubscriptionSchema = insertSubscriptionSchema.omit({
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  nextRenewalDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => {
    if (!val) return null;
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  nextPaymentAmount: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => {
    if (!val) return null;
    return typeof val === 'string' ? parseFloat(val) : val;
  }),
});

interface SubscriptionCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubscriptionCreateModal({ open, onOpenChange }: SubscriptionCreateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof createSubscriptionSchema>>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      name: "",
      cost: "0",
      currency: "USD",
      frequency: "monthly",
      startDate: new Date(),
      nextRenewalDate: null,
      nextPaymentAmount: null,
      useCustomAmount: false,
      description: "",
      category: "general",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createSubscriptionSchema>) => {
      return await apiRequest("/api/subscriptions", "POST", data);
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

  const onSubmit = (data: z.infer<typeof createSubscriptionSchema>) => {
    setIsSubmitting(true);
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            Add New Subscription
          </DialogTitle>
          <DialogDescription>
            Add a new subscription to track its cost and renewal dates.
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
                    <FormLabel>Cost *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="9.99"
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
                      // Show next date fields only for "next-date" frequency
                      if (value === "next-date") {
                        // Reset next date form fields
                        form.setValue("nextRenewalDate", null);
                        form.setValue("useCustomAmount", false);
                        form.setValue("nextPaymentAmount", null);
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
                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        className="bg-white/50 border-white/20 focus:border-blue-300"
                        data-testid="input-start-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Next Payment Date - only shown for "next-date" frequency */}
              {form.watch("frequency") === "next-date" && (
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
                          value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
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

            {/* Custom Amount Options - only shown for "next-date" frequency */}
            {form.watch("frequency") === "next-date" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="useCustomAmount"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="radio"
                          checked={!field.value}
                          onChange={() => {
                            field.onChange(false);
                            setShowCustomAmount(false);
                            form.setValue("nextPaymentAmount", null);
                          }}
                          className="w-4 h-4"
                          data-testid="radio-same-amount"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Use same subscription amount (${form.watch("cost")})
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="useCustomAmount"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="radio"
                          checked={field.value}
                          onChange={() => {
                            field.onChange(true);
                            setShowCustomAmount(true);
                          }}
                          className="w-4 h-4"
                          data-testid="radio-custom-amount"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Use custom amount for next payment
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Custom Amount Input - shown when custom amount is selected */}
                {form.watch("useCustomAmount") && (
                  <FormField
                    control={form.control}
                    name="nextPaymentAmount"
                    render={({ field }) => (
                      <FormItem className="ml-7">
                        <FormLabel>Custom Amount *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter custom amount"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            className="bg-white/50 border-white/20 focus:border-blue-300"
                            data-testid="input-custom-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
                      placeholder="Optional description or notes about this subscription..."
                      className="resize-none bg-white/50 border-white/20 focus:border-blue-300"
                      rows={3}
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
                data-testid="button-submit"
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