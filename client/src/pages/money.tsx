import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, DollarSign, TrendingUp, TrendingDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { LoanCreateModal } from "@/components/loan-modal/loan-create-modal";
import { LoanEditModal } from "@/components/loan-modal/loan-edit-modal";
import { PaymentCreateModal } from "@/components/payment-modal/payment-create-modal";
import { useToast } from "@/hooks/use-toast";
import type { Loan, LoanPayment } from "@shared/schema";

export function MoneyPage() {
  const [isCreateLoanOpen, setIsCreateLoanOpen] = useState(false);
  const [isCreatePaymentOpen, setIsCreatePaymentOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loans = [], isLoading: loansLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });

  const { data: allPayments = [] } = useQuery<LoanPayment[]>({
    queryKey: ["/api/loan-payments"],
  });

  const deleteLoanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/loans/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loan-payments"] });
      toast({
        title: "Success",
        description: "Loan deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete loan",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "partially_paid":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "fully_paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "partially_paid":
        return "Partially Paid";
      case "fully_paid":
        return "Fully Paid";
      default:
        return status;
    }
  };

  const getPaymentsForLoan = (loanId: number) => {
    return allPayments.filter((payment: LoanPayment) => payment.loanId === loanId);
  };

  // Calculate summary stats
  const totalLoaned = loans.reduce((sum: number, loan: Loan) => sum + parseFloat(loan.totalAmount), 0);
  const totalPaid = loans.reduce((sum: number, loan: Loan) => sum + parseFloat(loan.amountPaid), 0);
  const totalRemaining = loans.reduce((sum: number, loan: Loan) => sum + parseFloat(loan.remainingAmount), 0);
  const activeLoanCount = loans.filter((loan: Loan) => loan.status === "active").length;

  if (loansLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="container mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading money tracking...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="container mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 font-quicksand">
              Money Tracking
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track loans given to people and monitor repayments
            </p>
          </div>
          <Button
            onClick={() => setIsCreateLoanOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            data-testid="button-create-loan"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Loan
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Loaned</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-loaned">
                ${totalLoaned.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-total-paid">
                ${totalPaid.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="text-total-remaining">
                ${totalRemaining.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Loans</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="text-active-loans">
                {activeLoanCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loans List */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Loan Details
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Manage your loans and track payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loans.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No loans yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first loan to start tracking money given to people
                </p>
                <Button
                  onClick={() => setIsCreateLoanOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  data-testid="button-create-first-loan"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Loan
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {loans.map((loan: Loan) => (
                  <div
                    key={loan.id}
                    className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                    data-testid={`loan-card-${loan.id}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {loan.personName}
                        </h3>
                        {loan.personEmail && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{loan.personEmail}</p>
                        )}
                        {loan.personPhone && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{loan.personPhone}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(loan.status)}>
                        {getStatusLabel(loan.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${parseFloat(loan.totalAmount).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Amount Paid</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${parseFloat(loan.amountPaid).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                        <p className="text-lg font-semibold text-red-600">
                          ${parseFloat(loan.remainingAmount).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {loan.dueDate && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(loan.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {loan.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                        <p className="text-sm text-gray-900 dark:text-white">{loan.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLoan(loan)}
                        data-testid={`button-edit-loan-${loan.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLoanForPayment(loan)}
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        data-testid={`button-add-payment-${loan.id}`}
                      >
                        Add Payment
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteLoanMutation.mutate(loan.id)}
                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        data-testid={`button-delete-loan-${loan.id}`}
                      >
                        Delete
                      </Button>
                    </div>

                    {/* Payment History */}
                    {getPaymentsForLoan(loan.id).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Recent Payments
                        </h4>
                        <div className="space-y-2">
                          {getPaymentsForLoan(loan.id).slice(0, 3).map((payment: LoanPayment) => (
                            <div
                              key={payment.id}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600 dark:text-gray-400">
                                {new Date(payment.paymentDate).toLocaleDateString()}
                              </span>
                              <span className="font-medium text-green-600">
                                ${parseFloat(payment.amount).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <LoanCreateModal
        isOpen={isCreateLoanOpen}
        onClose={() => setIsCreateLoanOpen(false)}
      />

      {selectedLoan && (
        <LoanEditModal
          loan={selectedLoan}
          isOpen={!!selectedLoan}
          onClose={() => setSelectedLoan(null)}
        />
      )}

      {selectedLoanForPayment && (
        <PaymentCreateModal
          loan={selectedLoanForPayment}
          isOpen={!!selectedLoanForPayment}
          onClose={() => setSelectedLoanForPayment(null)}
        />
      )}
    </div>
  );
}