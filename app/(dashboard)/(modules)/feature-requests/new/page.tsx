"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileIcon, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import { usePermissions } from "@/hooks/use-permissions";
import { Resource, Action, PermissionScope, buildPermissionKey } from "@/server/rbac/permissions";

// Form validation schema
const featureRequestSchema = z.object({
  actionType: z.enum(["ADD", "DELETE", "MODIFY"], {
    required_error: "Please select an action type",
  }),
  pageName: z.string().min(1, "Page name is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  conditions: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

type FeatureRequestFormData = z.infer<typeof featureRequestSchema>;

interface Attachment {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export default function NewFeatureRequestPage() {
  const router = useRouter();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentPageUrl, setCurrentPageUrl] = useState("");

  // Permission check
  const { hasPermission } = usePermissions();
  const CREATE_PERMISSION = buildPermissionKey(Resource.FEATURE_REQUEST, Action.CREATE, PermissionScope.OWN);
  const canCreate = hasPermission(CREATE_PERMISSION);

  // Get current page URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPageUrl(window.location.href);
    }
  }, []);

  // Form setup
  const form = useForm<FeatureRequestFormData>({
    resolver: zodResolver(featureRequestSchema),
    defaultValues: {
      actionType: "ADD",
      pageName: "",
      title: "",
      description: "",
      conditions: "",
      priority: "MEDIUM",
    },
  });

  // Create mutation
  const createMutation = api.featureRequest.create.useMutation({
    onSuccess: () => {
      toast.success("Feature request submitted successfully!");
      router.push("/feature-requests/manage");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit feature request");
    },
  });

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedTypes.includes(file.type)) {
          toast.error(`File type not allowed: ${file.name}`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File too large: ${file.name} (max 10MB)`);
          continue;
        }

        // Upload to S3
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "feature-requests");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setAttachments((prev) => [
            ...prev,
            {
              fileUrl: data.cloud_storage_path,
              fileName: data.fileName,
              fileSize: data.fileSize,
              fileType: file.type,
            },
          ]);
          toast.success(`File uploaded: ${data.fileName}`);
        } else {
          toast.error(data.error || "Failed to upload file");
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit form
  const onSubmit = (data: FeatureRequestFormData) => {
    createMutation.mutate({
      ...data,
      pageUrl: currentPageUrl,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  };

  if (!canCreate) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to create feature requests.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Submit Feature Request"
        description="Request new features, modifications, or report issues with the platform"
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Feature Request Details</CardTitle>
          <CardDescription>
            Please provide detailed information about your request to help us understand and prioritize it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Action Type */}
              <FormField
                control={form.control}
                name="actionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADD">Add New Feature</SelectItem>
                        <SelectItem value="MODIFY">Modify Existing Feature</SelectItem>
                        <SelectItem value="DELETE">Remove Feature</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      What type of change are you requesting?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Page Name */}
              <FormField
                control={form.control}
                name="pageName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page/Location *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Invoices Page, User Management, Dashboard"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Where on the platform is this feature located or should be added?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief, descriptive title of your request"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a detailed description of what you need and why..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Be as specific as possible. Include current behavior, expected behavior, and use cases.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditions */}
              <FormField
                control={form.control}
                name="conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Conditions/Context</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specific conditions, requirements, or context..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Any edge cases, business rules, or special considerations.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low - Nice to have</SelectItem>
                        <SelectItem value="MEDIUM">Medium - Would improve workflow</SelectItem>
                        <SelectItem value="HIGH">High - Critical for operations</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How important is this request for your work?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Attachments */}
              <div className="space-y-4">
                <div>
                  <FormLabel>Attachments (Optional)</FormLabel>
                  <FormDescription className="mb-2">
                    Upload screenshots, documents, or mockups to support your request (max 10MB per file)
                  </FormDescription>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Files
                        </>
                      )}
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </div>
                </div>

                {/* Show uploaded files */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uploaded Files:</p>
                    <div className="space-y-2">
                      {attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{attachment.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {(attachment.fileSize / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-4 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || uploading}
                  className="flex-1 sm:flex-initial"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
