"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, CreditCard, Star } from "lucide-react";
import type { BankAccountUsage } from "@prisma/client";

type BankAccount = {
  id: string;
  accountName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  bankName?: string | null;
  swiftCode?: string | null;
  iban?: string | null;
  currency?: string | null;
  usage?: BankAccountUsage | null;
  isPrimary?: boolean;
  country?: string | null;
  // Legacy fields
  name?: string | null;
};

type Props = {
  account: BankAccount;
  onEdit: () => void;
  onDelete: () => void;
};

const USAGE_LABELS: Record<BankAccountUsage, string> = {
  SALARY: "Salary",
  GROSS: "Gross",
  EXPENSES: "Expenses",
  OTHER: "Other",
};

const USAGE_COLORS: Record<BankAccountUsage, string> = {
  SALARY: "bg-green-100 text-green-800 border-green-200",
  GROSS: "bg-blue-100 text-blue-800 border-blue-200",
  EXPENSES: "bg-orange-100 text-orange-800 border-orange-200",
  OTHER: "bg-gray-100 text-gray-800 border-gray-200",
};

export function BankAccountCard({ account, onEdit, onDelete }: Props) {
  const displayName = account.accountName || account.bankName || account.name || "Unnamed Account";
  const displayBank = account.bankName || account.name;
  const displayAccountNumber = account.iban || account.accountNumber;

  return (
    <Card className="relative">
      {account.isPrimary && (
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            Primary
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          {displayName}
        </CardTitle>
        {account.usage && (
          <Badge
            variant="outline"
            className={`w-fit ${USAGE_COLORS[account.usage]}`}
          >
            {USAGE_LABELS[account.usage]}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Account Holder */}
        {account.accountHolder && (
          <div>
            <p className="text-xs text-muted-foreground">Account Holder</p>
            <p className="text-sm font-medium">{account.accountHolder}</p>
          </div>
        )}

        {/* Bank Name */}
        {displayBank && (
          <div>
            <p className="text-xs text-muted-foreground">Bank</p>
            <p className="text-sm font-medium">{displayBank}</p>
          </div>
        )}

        {/* Account Number / IBAN */}
        {displayAccountNumber && (
          <div>
            <p className="text-xs text-muted-foreground">
              {account.iban ? "IBAN" : "Account Number"}
            </p>
            <p className="text-sm font-mono">
              {displayAccountNumber.slice(0, 4)}...{displayAccountNumber.slice(-4)}
            </p>
          </div>
        )}

        {/* SWIFT Code */}
        {account.swiftCode && (
          <div>
            <p className="text-xs text-muted-foreground">SWIFT / BIC</p>
            <p className="text-sm font-mono">{account.swiftCode}</p>
          </div>
        )}

        {/* Currency & Country */}
        <div className="flex gap-4">
          {account.currency && (
            <div>
              <p className="text-xs text-muted-foreground">Currency</p>
              <p className="text-sm font-medium">{account.currency}</p>
            </div>
          )}
          {account.country && (
            <div>
              <p className="text-xs text-muted-foreground">Country</p>
              <p className="text-sm font-medium">{account.country}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit className="mr-2 h-3 w-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
