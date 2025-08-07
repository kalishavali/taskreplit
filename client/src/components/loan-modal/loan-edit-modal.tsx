import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { updateLoanSchema, type Loan } from "@shared/schema";
import { CURRENCIES } from "@/lib/currency";

const editLoanSchema = updateLoanSchema.extend({
  dueDate: z.string().optional(),
});

type EditLoanForm = z.infer<typeof editLoanSchema>;

interface LoanEditModalProps {
  loan: Loan;
  isOpen: boolean;
  onClose: () => void;
}

export function LoanEditModal({ loan, isOpen, onClose }: LoanEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditLoanForm>({
    resolver: zodResolver(editLoanSchema),
    defaultValues: {
      personName: loan.personName,
      personEmail: loan.personEmail || undefined,
      personPhone: loan.personPhone || undefined,
      totalAmount: loan.totalAmount,
      currency: loan.currency || "USD",
      notes: loan.notes || undefined,
      dueDate: loan.dueDate ? new Date(loan.dueDate).toISOString().split('T')[0] : "",
    },
  });

  const updateLoanMutation = useMutation({
    mutationFn: async (data: EditLoanForm) => {
      const loanData = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      };
      return await apiRequest(`/api/loans/${loan.id}`, "PUT", loanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({
        title: "Success",
        description: "Loan updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update loan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditLoanForm) => {
    updateLoanMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Loan - {loan.personName}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="personName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Person Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter person's name"
                        className="bg-white/50 dark:bg-gray-700/50"
                        data-testid="input-person-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Amount *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="bg-white/50 dark:bg-gray-700/50"
                        data-testid="input-total-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Currency *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/50 dark:bg-gray-700/50" data-testid="select-currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code} - {currency.name}
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
                name="personEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="person@example.com"
                        className="bg-white/50 dark:bg-gray-700/50"
                        data-testid="input-person-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+1 (555) 123-4567"
                        className="bg-white/50 dark:bg-gray-700/50"
                        data-testid="input-person-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">Due Date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      className="bg-white/50 dark:bg-gray-700/50"
                      data-testid="input-due-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional notes about this loan..."
                      className="bg-white/50 dark:bg-gray-700/50 min-h-[100px]"
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateLoanMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                data-testid="button-submit"
              >
                {updateLoanMutation.isPending ? "Updating..." : "Update Loan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}