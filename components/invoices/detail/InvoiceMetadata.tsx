"use client";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Building2, Copy, AlertCircle, LinkIcon } from "lucide-react";
import Link from "next/link";

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

      {/* Payment Destination - Tenant Company Information */}
      {tenantCompany && (
        <>
          <Separator className="my-6" />
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-700" />
              <h3 className="text-lg font-bold text-green-900">PAYMENT DESTINATION</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Company Name</Label>
                <p className="font-bold text-lg">{tenantCompany.name}</p>
              </div>
              
              {tenantCompany.contactEmail && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="text-sm">{tenantCompany.contactEmail}</p>
                  </div>
                  {tenantCompany.contactPhone && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="text-sm">{tenantCompany.contactPhone}</p>
                    </div>
                  )}
                </div>
              )}
              
              {tenantCompany.address1 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <p className="text-sm">
                    {[
                      tenantCompany.address1,
                      tenantCompany.address2,
                      tenantCompany.city,
                      tenantCompany.state,
                      tenantCompany.postCode,
                      tenantCompany.country?.name,
                    ].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
            </div>

            {/* Bank Account Details */}
            <div className="mt-4 pt-4 border-t-2 border-green-300">
              <h4 className="font-semibold text-sm text-green-900 mb-3">BANK ACCOUNT DETAILS</h4>
              {tenantCompany?.bank ? (
                <div className="grid grid-cols-1 gap-3">
                  {tenantCompany.bank.name && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <div>
                        <Label className="text-xs text-muted-foreground">Bank Name</Label>
                        <p className="font-medium">{tenantCompany.bank.name}</p>
                      </div>
                    </div>
                  )}
                  {tenantCompany.bank.accountNumber && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Account Number</Label>
                        <p className="font-mono text-sm font-bold">{tenantCompany.bank.accountNumber}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(tenantCompany!.bank!.accountNumber!, "Account number")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {tenantCompany.bank.iban && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">IBAN</Label>
                        <p className="font-mono text-sm font-bold">{tenantCompany.bank.iban}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(tenantCompany!.bank!.iban!, "IBAN")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {tenantCompany.bank.swiftCode && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">SWIFT/BIC Code</Label>
                        <p className="font-mono text-sm font-bold">{tenantCompany.bank.swiftCode}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(tenantCompany!.bank!.swiftCode!, "SWIFT code")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {tenantCompany.bank.address && (
                    <div className="p-3 bg-white rounded-lg border border-green-200">
                      <Label className="text-xs text-muted-foreground">Bank Address</Label>
                      <p className="text-sm mt-1">{tenantCompany.bank.address}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800 font-medium">No bank account linked</p>
                </div>
              )}
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
