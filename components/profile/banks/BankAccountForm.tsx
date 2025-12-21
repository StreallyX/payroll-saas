"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { BankAccountUsage } from "@prisma/client";

export type BankAccountFormData = {
  id?: string;
  // Account identification
  accountName?: string;
  accountNumber?: string;
  accountHolder?: string;
  
  // Bank information
  bankName?: string;
  swiftCode?: string;
  intermediarySwiftCode?: string;
  routingNumber?: string;
  sortCode?: string;
  branchCode?: string;
  iban?: string;
  
  // Bank address
  bankAddress?: string;
  bankCity?: string;
  country?: string;
  state?: string;
  postCode?: string;
  
  // Account details
  currency?: string;
  usage?: BankAccountUsage;
  
  // Flags
  isPrimary?: boolean;
};

type Props = {
  initialData?: BankAccountFormData;
  onSubmit: (data: BankAccountFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const USAGE_OPTIONS: { value: BankAccountUsage; label: string }[] = [
  { value: "SALARY", label: "Salary" },
  { value: "GROSS", label: "Gross" },
  { value: "EXPENSES", label: "Expenses" },
  { value: "OTHER", label: "Other" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
  { value: "INR", label: "INR - Indian Rupee" },
];

export function BankAccountForm({ initialData, onSubmit, onCancel, isSubmitting }: Props) {
  const [formData, setFormData] = useState<BankAccountFormData>(initialData || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof BankAccountFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Identification Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Account Identification</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name / Label</Label>
            <Input
              id="accountName"
              value={formData.accountName || ""}
              onChange={(e) => updateField("accountName", e.target.value)}
              placeholder="e.g., Main Salary Account"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountHolder">Account Holder Name</Label>
            <Input
              id="accountHolder"
              value={formData.accountHolder || ""}
              onChange={(e) => updateField("accountHolder", e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usage">Account Usage / Purpose</Label>
            <Select
              value={formData.usage}
              onValueChange={(value) => updateField("usage", value as BankAccountUsage)}
            >
              <SelectTrigger id="usage">
                <SelectValue placeholder="Select usage" />
              </SelectTrigger>
              <SelectContent>
                {USAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => updateField("currency", value)}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Account Numbers Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Account Numbers</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={formData.accountNumber || ""}
              onChange={(e) => updateField("accountNumber", e.target.value)}
              placeholder="Local account number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={formData.iban || ""}
              onChange={(e) => updateField("iban", e.target.value)}
              placeholder="GB29 NWBK 6016 1331 9268 19"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routingNumber">Routing Number</Label>
            <Input
              id="routingNumber"
              value={formData.routingNumber || ""}
              onChange={(e) => updateField("routingNumber", e.target.value)}
              placeholder="For US banks"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortCode">Sort Code</Label>
            <Input
              id="sortCode"
              value={formData.sortCode || ""}
              onChange={(e) => updateField("sortCode", e.target.value)}
              placeholder="For UK banks"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branchCode">Branch Code</Label>
            <Input
              id="branchCode"
              value={formData.branchCode || ""}
              onChange={(e) => updateField("branchCode", e.target.value)}
              placeholder="Branch identifier"
            />
          </div>
        </div>
      </div>

      {/* Bank Information Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Bank Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={formData.bankName || ""}
              onChange={(e) => updateField("bankName", e.target.value)}
              placeholder="Bank of America"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="swiftCode">SWIFT / BIC Code</Label>
            <Input
              id="swiftCode"
              value={formData.swiftCode || ""}
              onChange={(e) => updateField("swiftCode", e.target.value)}
              placeholder="CHASUS33"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="intermediarySwiftCode">Intermediary SWIFT Code</Label>
            <Input
              id="intermediarySwiftCode"
              value={formData.intermediarySwiftCode || ""}
              onChange={(e) => updateField("intermediarySwiftCode", e.target.value)}
              placeholder="For international transfers"
            />
          </div>
        </div>
      </div>

      {/* Bank Address Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Bank Address</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bankAddress">Street Address</Label>
            <Input
              id="bankAddress"
              value={formData.bankAddress || ""}
              onChange={(e) => updateField("bankAddress", e.target.value)}
              placeholder="123 Main Street"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankCity">City</Label>
            <Input
              id="bankCity"
              value={formData.bankCity || ""}
              onChange={(e) => updateField("bankCity", e.target.value)}
              placeholder="New York"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State / County</Label>
            <Input
              id="state"
              value={formData.state || ""}
              onChange={(e) => updateField("state", e.target.value)}
              placeholder="NY"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country || ""}
              onChange={(e) => updateField("country", e.target.value)}
              placeholder="United States"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postCode">Post Code / ZIP</Label>
            <Input
              id="postCode"
              value={formData.postCode || ""}
              onChange={(e) => updateField("postCode", e.target.value)}
              placeholder="10001"
            />
          </div>
        </div>
      </div>

      {/* Primary Account Flag */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPrimary"
            checked={formData.isPrimary || false}
            onChange={(e) => updateField("isPrimary", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isPrimary" className="font-normal">
            Set as primary account
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Your primary account will be selected by default for payments
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Update" : "Create"} Account
        </Button>
      </div>
    </form>
  );
}
