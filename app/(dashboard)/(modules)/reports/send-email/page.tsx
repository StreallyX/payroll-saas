"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Send, FileText, AlertCircle, CheckCircle, Info } from "lucide-react";
import { toast } from "sonner";

export default function SendEmailPage() {
  const [emailType, setEmailType] = useState<"template" | "custom">("template");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isHtml, setIsHtml] = useState(true);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  const { data: templates = [] } = api.email.getTemplates.useQuery();
  const sendMutation = api.email.send.useMutation({
    onSuccess: () => {
      toast.success("Email sent successfully");
      // Reset form
      setTo("");
      setSubject("");
      setBody("");
      setTemplateVariables({});
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send email");
    },
  });

  const selectedTemplateData = templates.find((t) => t.name === selectedTemplate);

  const handleSendEmail = () => {
    if (!to) {
      toast.error("Please enter recipient email");
      return;
    }

    if (!subject) {
      toast.error("Please enter email subject");
      return;
    }

    if (emailType === "custom" && !body) {
      toast.error("Please enter email content");
      return;
    }

    if (emailType === "template" && !selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    // Check if all required variables are filled
    if (emailType === "template" && selectedTemplateData) {
      const missingVars = selectedTemplateData.variables.filter(
        (v) => !templateVariables[v]
      );
      if (missingVars.length > 0) {
        toast.error(`Please fill in all variables: ${missingVars.join(", ")}`);
        return;
      }
    }

    sendMutation.mutate({
      to: to.includes(",") ? to.split(",").map((e) => e.trim()) : to,
      subject,
      body,
      isHtml,
      templateName: emailType === "template" ? selectedTemplate : undefined,
      templateData: emailType === "template" ? templateVariables : undefined,
    });
  };

  return (
    <RouteGuard permission="email.access.page">
      <div className="space-y-6">
        <PageHeader
          title="Send Email"
          description="Send emails to users with templates or custom content"
        />

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            All emails will be logged in the Email Logs for tracking and audit purposes.
            Use variables like {`{{userName}}`} and {`{{companyName}}`} in templates.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>
              Choose between predefined templates or create a custom email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={emailType} onValueChange={(v) => setEmailType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template">
                  <FileText className="h-4 w-4 mr-2" />
                  Use Template
                </TabsTrigger>
                <TabsTrigger value="custom">
                  <Mail className="h-4 w-4 mr-2" />
                  Custom Email
                </TabsTrigger>
              </TabsList>

              {/* Template Email */}
              <TabsContent value="template" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an email template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.name} value={template.name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{template.displayName}</span>
                            <span className="text-xs text-muted-foreground">
                              {template.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplateData && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        Template Variables
                        <Badge variant="secondary" className="text-xs">
                          {selectedTemplateData.variables.length} required
                        </Badge>
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {selectedTemplateData.variables.map((variable) => (
                          <div key={variable}>
                            <Label className="text-xs">{`{{${variable}}}`}</Label>
                            <Input
                              value={templateVariables[variable] || ""}
                              onChange={(e) =>
                                setTemplateVariables({
                                  ...templateVariables,
                                  [variable]: e.target.value,
                                })
                              }
                              placeholder={`Enter ${variable}...`}
                              className="mt-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Custom Email */}
              <TabsContent value="custom" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Email Content</Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter your email content here...&#10;&#10;You can use variables: {{userName}}, {{companyName}}"
                    rows={10}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isHtml"
                    checked={isHtml}
                    onChange={(e) => setIsHtml(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="isHtml" className="text-sm font-normal cursor-pointer">
                    HTML Email (uncheck for plain text)
                  </Label>
                </div>
              </TabsContent>
            </Tabs>

            {/* Common Fields */}
            <div className="space-y-4 mt-6 pt-6 border-t">
              <div className="space-y-2">
                <Label>Recipients</Label>
                <Input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="email@example.com (use commas for multiple)"
                />
                <p className="text-xs text-muted-foreground">
                  Enter one or more email addresses separated by commas
                </p>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                />
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={handleSendEmail}
                disabled={sendMutation.isLoading}
                className="min-w-[120px]"
              >
                {sendMutation.isLoading ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Templates Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Email Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.name}
                  className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <h4 className="font-medium mb-1">{template.displayName}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
