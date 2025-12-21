"use client";

interface LineItem {
  id: string;
  description: string;
  quantity: number | any; // Decimal from Prisma
  unitPrice: number | any; // Decimal from Prisma
  amount: number | any; // Decimal from Prisma
}

interface InvoiceLineItemsProps {
  lineItems: LineItem[];
  workTotal: number;
  formatCurrency: (amount: number) => string;
}

export function InvoiceLineItems({
  lineItems,
  workTotal,
  formatCurrency,
}: InvoiceLineItemsProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">SERVICES / LINE ITEMS</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-semibold text-sm">Description</th>
              <th className="text-right p-3 font-semibold text-sm w-24">Qty</th>
              <th className="text-right p-3 font-semibold text-sm w-32">Unit Price</th>
              <th className="text-right p-3 font-semibold text-sm w-32">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lineItems && lineItems.length > 0 ? (
              lineItems.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="p-3 text-sm">{item.description}</td>
                  <td className="p-3 text-sm text-right">{Number(item.quantity)}</td>
                  <td className="p-3 text-sm text-right">{formatCurrency(Number(item.unitPrice))}</td>
                  <td className="p-3 text-sm text-right font-medium">{formatCurrency(Number(item.amount))}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  No line items available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Work Subtotal */}
      {lineItems && lineItems.length > 0 && (
        <div className="flex justify-end mt-3">
          <div className="w-64 flex justify-between items-center px-4 py-2 bg-muted/30 rounded">
            <span className="text-sm font-medium">Work Subtotal:</span>
            <span className="font-semibold">{formatCurrency(workTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
