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
import { insertLoanPaymentSchema, type Loan } from "@shared/schema";

const createPaymentSchema = insertLoanPaymentSchema.extend({
  paymentDate: z.string().optional(),
}).omit({ userId: true, createdAt: true, updatedAt: true });

type CreatePaymentForm = z.infer<typeof createPaymentSchema>;

interface PaymentCreateModalProps {
  loan: Loan;
  isOpen: boolean;
  onClose: () => void;
  paymentType: "pay" | "settle";
}

export function PaymentCreateModal({ loan, isOpen, onClose, paymentType }: PaymentCreateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreatePaymentForm>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      loanId: loan.id,
      amount: "",
      paymentDate: new Date().toISOString().split('T')[0],
      paymentType: paymentType,
      notes: "",
      paymentMethod: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: CreatePaymentForm) => {
      const paymentData = {
        ...data,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      };
      return await apiRequest("/api/loan-payments", "POST", paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loan-payments"] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePaymentForm) => {
    console.log("Payment form submitted with data:", data);
    createPaymentMutation.mutate(data);
  };

  const remainingAmount = parseFloat(loan.remainingAmount);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            {paymentType === "pay" ? "Add Payment" : "Record Settlement"} - {loan.personName}
          </DialogTitle>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {paymentType === "pay" 
              ? "Adding more money to this loan (increases total amount)" 
              : `Recording borrower's payment. Remaining: ${remainingAmount.toFixed(2)}`
            }
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log("Form validation errors:", errors);
          })} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Payment Amount *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="bg-white/50 dark:bg-gray-700/50"
                        data-testid="input-payment-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Payment Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="bg-white/50 dark:bg-gray-700/50"
                        data-testid="input-payment-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className="bg-white/50 dark:bg-gray-700/50" data-testid="select-payment-method">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="phone_pay">Phone Pay</SelectItem>
                      <SelectItem value="google_pay">Google Pay</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Payment description (e.g., rent, groceries, medical, loan installment...)"
                      className="bg-white/50 dark:bg-gray-700/50 min-h-[80px]"
                      data-testid="input-payment-description"
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
                disabled={createPaymentMutation.isPending}
                onClick={() => console.log("Record Payment button clicked")}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                data-testid="button-submit"
              >
                {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}