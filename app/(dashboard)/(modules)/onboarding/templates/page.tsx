"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/trpc";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Plus, Trash2, Edit, Eye, AlertCircle, 
  GripVertical, FileText, CheckCircle2,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

interface Question {
  id?: string;
  questionText: string;
  questionType: "text" | "file";
  isRequired: boolean;
  order: number;
  optionalForCountries?: string[];
}

export default function OnboardingTemplatesPage() {
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // API Queries
  const { data: templates = [], isLoading, refetch } = api.onboardingTemplate.list.useQuery();

  const createTemplate = api.onboardingTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      refetch();
      resetForm();
      setViewMode("list");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateTemplate = api.onboardingTemplate.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      refetch();
      resetForm();
      setViewMode("list");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteTemplate = api.onboardingTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetch();
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setQuestions([]);
    setIsActive(true);
    setEditingTemplateId(null);
  };

  const handleCreate = () => {
    if (!name.trim()) return toast.error("Template name is required");
    if (questions.length === 0) return toast.error("Add at least one question");
    if (questions.some((q) => !q.questionText.trim())) {
      return toast.error("All questions must have text");
    }

    createTemplate.mutate({
      name,
      description,
      isActive,
      questions: questions.map(({ id, optionalForCountries, ...q }) => q),
    });
  };

  const handleUpdate = () => {
    if (!editingTemplateId) return;
    if (!name.trim()) return toast.error("Template name is required");
    if (questions.length === 0) return toast.error("Add at least one question");
    if (questions.some((q) => !q.questionText.trim())) {
      return toast.error("All questions must have text");
    }

    updateTemplate.mutate({
      id: editingTemplateId,
      name,
      description,
      isActive,
      questions: questions.map(({ id, optionalForCountries, ...q }) => q),
    });
  };

  const handleEdit = (template: any) => {
    setEditingTemplateId(template.id);
    setName(template.name);
    setDescription(template.description || "");
    setIsActive(template.isActive);
    setQuestions(
      template.questions.map((q: any) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        isRequired: q.isRequired,
        order: q.order,
        optionalForCountries: q.optionalForCountries || [],
      }))
    );
    setViewMode("edit");
  };

  const handleDuplicate = (template: any) => {
    setName(template.name + " (Copy)");
    setDescription(template.description || "");
    setIsActive(template.isActive);
    setQuestions(
      template.questions.map((q: any, index: number) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        isRequired: q.isRequired,
        order: index,
      }))
    );
    setViewMode("create");
  };

  const handlePreview = (templateId: string) => {
    setPreviewTemplateId(templateId);
    setPreviewDialogOpen(true);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        questionType: "text",
        isRequired: true,
        order: questions.length,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    // Reorder
    setQuestions(updated.map((q, i) => ({ ...q, order: i })));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const clone = [...questions];
    clone[index] = { ...clone[index], [field]: value };
    setQuestions(clone);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === questions.length - 1) return;

    const clone = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [clone[index], clone[targetIndex]] = [clone[targetIndex], clone[index]];
    
    // Update order
    setQuestions(clone.map((q, i) => ({ ...q, order: i })));
  };

  if (isLoading) return <LoadingState message="Loading templates..." />;

  const previewTemplate = templates.find(t => t.id === previewTemplateId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding Templates"
        description="Create and manage onboarding questionnaires for new users"
      />

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <>
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {templates.length} template{templates.length !== 1 ? "s" : ""} found
            </div>
            <Button onClick={() => setViewMode("create")}>
              <Plus className="mr-2 h-4 w-4" /> Create Template
            </Button>
          </div>

          {/* Templates List */}
          {templates.length === 0 ? (
            <EmptyState
              title="No Templates Found"
              description="Create your first onboarding template to get started"
              actionLabel="Create Template"
              onAction={() => setViewMode("create")}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{template.name}</CardTitle>
                          {template.isActive ? (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        {template.description && (
                          <CardDescription className="mt-2">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {template.questions?.length || 0} questions
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePreview(template.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setTemplateToDelete(template.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* CREATE/EDIT VIEW */}
      {(viewMode === "create" || viewMode === "edit") && (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {viewMode === "create" ? "Create New Template" : "Edit Template"}
            </h2>
            <Button variant="outline" onClick={() => {
              resetForm();
              setViewMode("list");
            }}>
              Cancel
            </Button>
          </div>

          {/* Template Details */}
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>
                Define the name and description of the onboarding template
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., KYC Standard Template, Contractor Onboarding"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief description of what this template is for..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active (can be assigned to new users)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Questions & Requirements</CardTitle>
              <CardDescription>
                Add all information and documents you need from users
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {questions.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No questions added yet. Click "Add Question" to start building your template.
                  </AlertDescription>
                </Alert>
              ) : (
                questions.map((q, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-3 bg-gray-50"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                        <Label className="font-semibold">Question {index + 1}</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveQuestion(index, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveQuestion(index, "down")}
                          disabled={index === questions.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div>
                      <Label>Question Text *</Label>
                      <Textarea
                        placeholder="Enter your question here..."
                        value={q.questionText}
                        onChange={(e) =>
                          updateQuestion(index, "questionText", e.target.value)
                        }
                        rows={2}
                      />
                    </div>

                    {/* Question Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Answer Type *</Label>
                        <select
                          className="w-full border rounded-md px-3 py-2 bg-background"
                          value={q.questionType}
                          onChange={(e) =>
                            updateQuestion(index, "questionType", e.target.value)
                          }
                        >
                          <option value="text">Text Answer</option>
                          <option value="file">File Upload</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`required-${index}`}
                            checked={q.isRequired}
                            onChange={(e) =>
                              updateQuestion(index, "isRequired", e.target.checked)
                            }
                            className="rounded"
                          />
                          <Label htmlFor={`required-${index}`} className="cursor-pointer">
                            Required
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <Button onClick={addQuestion} variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Question
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setViewMode("list");
              }}
            >
              Cancel
            </Button>
            <Button 
              size="lg" 
              onClick={viewMode === "create" ? handleCreate : handleUpdate}
              disabled={createTemplate.isPending || updateTemplate.isPending}
            >
              {viewMode === "create" 
                ? (createTemplate.isPending ? "Creating..." : "Create Template")
                : (updateTemplate.isPending ? "Updating..." : "Update Template")
              }
            </Button>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Warning: This template cannot be deleted if it's currently assigned to users.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => templateToDelete && deleteTemplate.mutate({ id: templateToDelete })}
              disabled={deleteTemplate.isPending}
            >
              {deleteTemplate.isPending ? "Deleting..." : "Delete Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              This is how the template will appear to users
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4 mt-4">
              {/* Template Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold">{previewTemplate.name}</h3>
                {previewTemplate.description && (
                  <p className="text-sm text-gray-600 mt-1">{previewTemplate.description}</p>
                )}
                <div className="flex gap-2 mt-2">
                  {previewTemplate.isActive ? (
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                  <Badge variant="outline">
                    {previewTemplate.questions?.length || 0} questions
                  </Badge>
                </div>
              </div>

              {/* Questions Preview */}
              {previewTemplate.questions?.map((q: any, index: number) => (
                <div key={q.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{q.questionText}</h4>
                        {q.isRequired && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Type: {q.questionType === "text" ? "Text Answer" : "File Upload"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
