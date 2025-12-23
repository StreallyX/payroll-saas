"use client";

import { Separator } from "@/components/ui/separator";

interface Expense {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  expenseDate: Date | string;
  amount: number | any; // Decimal from Prisma
}

interface InvoiceExpensesProps {
  expenses: Expense[];
  totalExpenses: number;
  formatCurrency: (amount: number) => string;
}

export function InvoiceExpenses({
  expenses,
  totalExpenses,
  formatCurrency,
}: InvoiceExpensesProps) {
  if (!expenses || expenses.length === 0 || totalExpenses === 0) {
    return null;
  }

  return (
    <>
      <Separator className="my-6" />
      <div>
        <h3 className="text-lg font-semibold mb-4">EXPENSES</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-semibold text-sm">Description</th>
                <th className="text-left p-3 font-semibold text-sm">Category</th>
                <th className="text-left p-3 font-semibold text-sm">Date</th>
                <th className="text-right p-3 font-semibold text-sm w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-muted/20">
                  <td className="p-3 text-sm">
                    <div className="font-medium">{expense.title}</div>
                    {expense.description && (
                      <div className="text-xs text-muted-foreground">{expense.description}</div>
                    )}
                  </td>
                  <td className="p-3 text-sm capitalize">{expense.category}</td>
                  <td className="p-3 text-sm">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                  <td className="p-3 text-sm text-right font-medium">{formatCurrency(Number(expense.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Expenses Total */}
        <div className="flex justify-end mt-3">
          <div className="w-64 flex justify-between items-center px-4 py-2 bg-muted/30 rounded">
            <span className="text-sm font-medium">Total Expenses:</span>
            <span className="font-semibold">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
