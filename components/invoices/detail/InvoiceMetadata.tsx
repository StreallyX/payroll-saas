"use client";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Copy, AlertCircle, LinkIcon, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface BankAccount {
  id: string;
  accountName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  iban?: string | null;
  swiftCode?: string | null;
  currency?: string | null;
  usage?: string | null;
  isPrimary?: boolean | null;
}

interface Company {
  id: string;
  name: string;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postCode?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  country?: {
    name: string;
  } | null;
  bank?: {
    name?: string | null;
    accountNumber?: string | null;
    iban?: string | null;
    swiftCode?: string | null;
    address?: string | null;
  } | null;
}

interface Sender {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface Receiver {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: {
    id: string;
    name: string;
    displayName?: string;
  } | null;
  companyUsers?: Array<{
    company: Company;
  }>;
  banks?: BankAccount[];
}

interface InvoiceMetadataProps {
  sender?: Sender | null;
  receiver?: Receiver | null;
  invoiceRecipient: string;
  tenantCompany?: Company | null;
  contractReference?: string | null;
  contractId?: string | null;
  canViewContract: boolean;
  invoiceNumber?: string | null;
  invoiceId: string;
  issueDate: Date | string;
  paymentTerms: string;
  contractorCompany?: Company | null;
  agencyCompany?: Company | null;
  clientCompany?: Company | null;
  copyToClipboard: (text: string, label: string) => void;
}

export function InvoiceMetadata({
  sender,
  receiver,
  invoiceRecipient,
  tenantCompany,
  contractReference,
  contractId,
  canViewContract,
  invoiceNumber,
  invoiceId,
  issueDate,
  paymentTerms,
  contractorCompany,
  agencyCompany,
  clientCompany,
  copyToClipboard,
}: InvoiceMetadataProps) {
  const [showAllBankAccounts, setShowAllBankAccounts] = useState(false);
  
  // 🔥 FIX: Get receiver's bank accounts (contractor or payroll user)
  const receiverBankAccounts = receiver?.banks || [];
  const primaryBankAccount = receiverBankAccounts.find(bank => bank.isPrimary) || receiverBankAccounts[0];
  
  return (
    <>
      {/* Invoice Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-bold mb-2">INVOICE</h2>
          <p className="text-lg text-muted-foreground">
            {invoiceNumber || `INV-${invoiceId.slice(0, 8)}`}
          </p>
        </div>
        <div className="text-right space-y-1">
          <div>
            <Label className="text-xs text-muted-foreground">Issue Date</Label>
            <p className="font-medium">{new Date(issueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Payment Terms</Label>
            <p className="font-medium text-blue-600">{paymentTerms}</p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* From / To Section */}
      <div className="grid grid-cols-2 gap-8">
        {/* From (Sender) */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">FROM</h3>
          <div className="space-y-1">
            <p className="font-bold text-lg">{sender?.name || "N/A"}</p>
            {sender?.email && <p className="text-sm">{sender.email}</p>}
            {sender?.phone && <p className="text-sm">{sender.phone}</p>}
            {contractorCompany && (
              <div className="mt-2 text-sm text-muted-foreground">
                <p>{contractorCompany.name}</p>
                {contractorCompany.address1 && (
                  <p>{contractorCompany.address1}</p>
                )}
                {contractorCompany.city && (
                  <p>
                    {[
                      contractorCompany.city,
                      contractorCompany.state,
                      contractorCompany.postCode,
                    ].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* To (Receiver - Payment Destination) */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">BILL TO</h3>
          <div className="space-y-1">
            <p className="font-bold text-lg">{receiver?.name || invoiceRecipient}</p>
            {receiver?.email && <p className="text-sm">{receiver.email}</p>}
            {receiver?.phone && <p className="text-sm">{receiver.phone}</p>}
            {receiver?.role && (
              <p className="text-xs text-muted-foreground mt-2">
                Role: {receiver.role.displayName || receiver.role.name}
              </p>
            )}
            
            {/* Receiver's Company Information */}
            {receiver?.companyUsers && receiver.companyUsers.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Company Information</p>
                {receiver.companyUsers.map((userCompany) => (
                  <div key={userCompany.company.id} className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{userCompany.company.name}</p>
                    {userCompany.company.contactEmail && (
                      <p className="text-xs">{userCompany.company.contactEmail}</p>
                    )}
                    {userCompany.company.contactPhone && (
                      <p className="text-xs">{userCompany.company.contactPhone}</p>
                    )}
                    {userCompany.company.address1 && (
                      <p className="text-xs mt-1">
                        {[
                          userCompany.company.address1,
                          userCompany.company.address2,
                          userCompany.company.city,
                          userCompany.company.state,
                          userCompany.company.postCode,
                          userCompany.company.country?.name,
                        ].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Fallback to contract participant company info if receiver has no direct company */}
            {(!receiver?.companyUsers || receiver.companyUsers.length === 0) && 
             (agencyCompany || clientCompany) && (
              <div className="mt-2 text-sm text-muted-foreground">
                {agencyCompany && (
                  <>
                    <p>{agencyCompany.name}</p>
                    {agencyCompany.contactEmail && (
                      <p>{agencyCompany.contactEmail}</p>
                    )}
                  </>
                )}
                {!agencyCompany && clientCompany && (
                  <>
                    <p>{clientCompany.name}</p>
                    {clientCompany.address1 && (
                      <p>{clientCompany.address1}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔥 FIX: Payment Destination - Receiver's Bank Account (Contractor or Payroll User) */}
      {receiverBankAccounts.length > 0 && (
        <>
          <Separator className="my-6" />
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-700" />
                <h3 className="text-lg font-bold text-green-900">PAYMENT DESTINATION</h3>
              </div>
              {receiverBankAccounts.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllBankAccounts(!showAllBankAccounts)}
                >
                  {showAllBankAccounts ? (
                    <>
                      <ChevronUp className="mr-1 h-4 w-4" />
                      Show Primary Only
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-4 w-4" />
                      Show All ({receiverBankAccounts.length})
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Payment Recipient</Label>
                <p className="font-bold text-lg">{receiver?.name || invoiceRecipient}</p>
                {receiver?.email && <p className="text-sm text-muted-foreground">{receiver.email}</p>}
              </div>
            </div>

            {/* Bank Account Details */}
            <div className="mt-4 pt-4 border-t-2 border-green-300">
              <h4 className="font-semibold text-sm text-green-900 mb-3">BANK ACCOUNT DETAILS</h4>
              
              {!showAllBankAccounts && primaryBankAccount ? (
                // Show primary bank account only
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground font-semibold">
                          {primaryBankAccount.accountName || primaryBankAccount.bankName || "Bank Account"}
                        </Label>
                        {primaryBankAccount.isPrimary && (
                          <Badge variant="default" className="bg-green-600">Primary</Badge>
                        )}
                      </div>
                      {primaryBankAccount.usage && (
                        <Badge variant="outline" className="text-xs">
                          {primaryBankAccount.usage}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {primaryBankAccount.bankName && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Bank Name</Label>
                          <p className="font-medium">{primaryBankAccount.bankName}</p>
                        </div>
                      )}
                      {primaryBankAccount.accountNumber && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Account Number</Label>
                            <p className="font-mono text-sm font-bold">{primaryBankAccount.accountNumber}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(primaryBankAccount.accountNumber!, "Account number")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {primaryBankAccount.iban && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">IBAN</Label>
                            <p className="font-mono text-sm font-bold">{primaryBankAccount.iban}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(primaryBankAccount.iban!, "IBAN")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {primaryBankAccount.swiftCode && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">SWIFT/BIC Code</Label>
                            <p className="font-mono text-sm font-bold">{primaryBankAccount.swiftCode}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(primaryBankAccount.swiftCode!, "SWIFT code")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {primaryBankAccount.currency && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Currency</Label>
                          <p className="text-sm">{primaryBankAccount.currency}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : showAllBankAccounts ? (
                // Show all bank accounts
                <div className="space-y-3">
                  {receiverBankAccounts.map((bank) => (
                    <div 
                      key={bank.id} 
                      className={`p-4 bg-white rounded-lg border shadow-sm ${
                        bank.isPrimary ? 'border-2 border-green-300' : 'border-green-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground font-semibold">
                            {bank.accountName || bank.bankName || "Bank Account"}
                          </Label>
                          {bank.isPrimary && (
                            <Badge variant="default" className="bg-green-600">Primary</Badge>
                          )}
                        </div>
                        {bank.usage && (
                          <Badge variant="outline" className="text-xs">
                            {bank.usage}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {bank.bankName && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Bank Name</Label>
                            <p className="font-medium">{bank.bankName}</p>
                          </div>
                        )}
                        {bank.accountNumber && (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">Account Number</Label>
                              <p className="font-mono text-sm font-bold">{bank.accountNumber}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(bank.accountNumber!, "Account number")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {bank.iban && (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">IBAN</Label>
                              <p className="font-mono text-sm font-bold">{bank.iban}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(bank.iban!, "IBAN")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {bank.swiftCode && (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">SWIFT/BIC Code</Label>
                              <p className="font-mono text-sm font-bold">{bank.swiftCode}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(bank.swiftCode!, "SWIFT code")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {bank.currency && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Currency</Label>
                            <p className="text-sm">{bank.currency}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Payment should be made to the account shown above. This is the {receiver?.role?.displayName || "recipient"}'s bank account.
              </p>
            </div>
          </div>
        </>
      )}
      
      {/* Show warning if no bank accounts found */}
      {receiverBankAccounts.length === 0 && receiver && (
        <>
          <Separator className="my-6" />
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-bold text-yellow-900">PAYMENT DESTINATION</h3>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-semibold">Payment Recipient</Label>
              <p className="font-bold text-lg">{receiver.name || invoiceRecipient}</p>
              {receiver.email && <p className="text-sm text-muted-foreground">{receiver.email}</p>}
            </div>
            <div className="p-4 bg-white border border-yellow-300 rounded-lg text-center">
              <AlertCircle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-yellow-800 font-medium">No bank account on file</p>
              <p className="text-xs text-yellow-700 mt-1">
                Please contact the recipient to obtain payment details
              </p>
            </div>
          </div>
        </>
      )}

      <Separator className="my-6" />

      {/* Contract Reference */}
      {contractId && (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <Label className="text-xs text-muted-foreground">Related Contract</Label>
            <p className="font-medium">{contractReference || `Contract #${contractId.slice(0, 8)}`}</p>
          </div>
          {canViewContract && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/contracts/${contractId}`}>
                <LinkIcon className="h-4 w-4 mr-2" />
                View Contract
              </Link>
            </Button>
          )}
        </div>
      )}

      <Separator className="my-6" />
    </>
  );
}
