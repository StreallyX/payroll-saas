
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/ui/page-header";
import { CheckCircle, Circle, Upload, FileText, AlertCircle } from "lucide-react";

/**
 * Contractor Onboarding Page
 * 
 * This page displays the onboarding process and required documents for contractors.
 * 
 * TODO:
 * - Implement tRPC query to fetch onboarding status from database
 * - Add document upload functionality with file validation
 * - Implement onboarding step completion tracking
 * - Add form submission for required information
 * - Implement progress calculation based on completed steps
 * - Add document status tracking (pending, approved, rejected)
 * - Implement notifications for missing documents
 * - Add file preview functionality
 */

// Mock data - TODO: Replace with real data from tRPC
const onboardingSteps = [
  {
    id: "1",
    title: "Personal Information",
    description: "Complete your basic profile",
    status: "completed",
    completedDate: "2024-01-10",
  },
  {
    id: "2",
    title: "Tax Documents",
    description: "Upload W-9 or W-8 form",
    status: "completed",
    completedDate: "2024-01-12",
  },
  {
    id: "3",
    title: "Direct Deposit Setup",
    description: "Provide bank account information",
    status: "completed",
    completedDate: "2024-01-13",
  },
  {
    id: "4",
    title: "Background Check",
    description: "Consent and complete background verification",
    status: "in_progress",
    completedDate: null,
  },
  {
    id: "5",
    title: "Contract Signature",
    description: "Review and sign employment agreement",
    status: "pending",
    completedDate: null,
  },
];

const requiredDocuments = [
  {
    id: "1",
    name: "W-9 Form",
    status: "approved",
    uploadDate: "2024-01-12",
    required: true,
  },
  {
    id: "2",
    name: "Government ID",
    status: "approved",
    uploadDate: "2024-01-11",
    required: true,
  },
  {
    id: "3",
    name: "Proof of Address",
    status: "pending_review",
    uploadDate: "2024-01-13",
    required: true,
  },
  {
    id: "4",
    name: "Resume",
    status: "missing",
    uploadDate: null,
    required: false,
  },
];

export default function ContractorOnboardingPage() {
  const completedSteps = onboardingSteps.filter((step) => step.status === "completed").length;
  const totalSteps = onboardingSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const getStepIcon = (status: string) => {
    if (status === "completed") {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
    if (status === "in_progress") {
      return <Circle className="h-6 w-6 animate-pulse text-blue-600" />;
    }
    return <Circle className="h-6 w-6 text-muted-foreground" />;
  };

  const getDocumentStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      approved: { variant: "default", label: "Approved" },
      pending_review: { variant: "secondary", label: "Pending Review" },
      missing: { variant: "destructive", label: "Missing" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Onboarding"
        description="Complete your onboarding process and upload required documents"
      />

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Progress</CardTitle>
          <CardDescription>
            {completedSteps} of {totalSteps} steps completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {progressPercentage.toFixed(0)}% complete
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Steps</CardTitle>
          <CardDescription>
            Complete all required steps to activate your contractor account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {onboardingSteps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="mt-1">{getStepIcon(step.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      {index + 1}. {step.title}
                    </h3>
                    {step.status === "completed" && (
                      <span className="text-sm text-muted-foreground">
                        Completed {step.completedDate}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {step.status === "in_progress" && (
                    <Button size="sm" className="mt-2">
                      Continue
                    </Button>
                  )}
                  {step.status === "pending" && (
                    <Button size="sm" variant="outline" className="mt-2">
                      Start
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Required Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
          <CardDescription>
            Upload all required documents to complete your onboarding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requiredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{doc.name}</h4>
                      {doc.required && (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    {doc.uploadDate && (
                      <p className="text-sm text-muted-foreground">
                        Uploaded {doc.uploadDate}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getDocumentStatusBadge(doc.status)}
                  {doc.status === "missing" ? (
                    <Button size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Missing Documents Alert */}
          {requiredDocuments.some(
            (doc) => doc.required && doc.status === "missing"
          ) && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <h4 className="font-medium text-amber-900 dark:text-amber-100">
                  Action Required
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Please upload all required documents to complete your onboarding
                  process.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
