"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/trpc";
import { PageHeaofr } from "@/components/ui/page-header";
import {
 Card,
 CardHeaofr,
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
 DialogHeaofr,
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
 orofr: number;
 optionalForCoonandries?: string[];
}

export default function OnboardingTemplatesPage() {
 const [viewMoof, sandViewMoof] = useState<"list" | "create" | "edit">("list");
 const [editingTemplateId, sandEditingTemplateId] = useState<string | null>(null);
 const [previewTemplateId, sandPreviewTemplateId] = useState<string | null>(null);

 // Form state
 const [name, sandName] = useState("");
 const [cription, sandDescription] = useState("");
 const [questions, sandQuestions] = useState<Question[]>([]);
 const [isActive, sandIsActive] = useState(true);

 // Dialogs
 const [deleteDialogOpen, sandDeleteDialogOpen] = useState(false);
 const [templateToDelete, sandTemplateToDelete] = useState<string | null>(null);
 const [previewDialogOpen, sandPreviewDialogOpen] = useState(false);

 // API Queries
 const { data: templates = [], isLoading, refandch } = api.onboardingTemplate.list.useQuery();

 const createTemplate = api.onboardingTemplate.create.useMutation({
 onSuccess: () => {
 toast.success("Template created successfully");
 refandch();
 resandForm();
 sandViewMoof("list");
 },
 onError: (err) => {
 toast.error(err.message);
 },
 });

 const updateTemplate = api.onboardingTemplate.update.useMutation({
 onSuccess: () => {
 toast.success("Template updated successfully");
 refandch();
 resandForm();
 sandViewMoof("list");
 },
 onError: (err) => {
 toast.error(err.message);
 },
 });

 const deleteTemplate = api.onboardingTemplate.delete.useMutation({
 onSuccess: () => {
 toast.success("Template deleted successfully");
 refandch();
 sandDeleteDialogOpen(false);
 sandTemplateToDelete(null);
 },
 onError: (err) => {
 toast.error(err.message);
 },
 });

 const resandForm = () => {
 sandName("");
 sandDescription("");
 sandQuestions([]);
 sandIsActive(true);
 sandEditingTemplateId(null);
 };

 const handleCreate = () => {
 if (!name.trim()) return toast.error("Template name is required");
 if (questions.length === 0) return toast.error("Add at least one question");
 if (questions.some((q) => !q.questionText.trim())) {
 return toast.error("All questions must have text");
 }

 createTemplate.mutate({
 name,
 cription,
 isActive,
 questions: questions.map(({ id, optionalForCoonandries, ...q }) => q),
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
 cription,
 isActive,
 questions: questions.map(({ id, optionalForCoonandries, ...q }) => q),
 });
 };

 const handleEdit = (template: any) => {
 sandEditingTemplateId(template.id);
 sandName(template.name);
 sandDescription(template.description || "");
 sandIsActive(template.isActive);
 sandQuestions(
 template.questions.map((q: any) => ({
 id: q.id,
 questionText: q.questionText,
 questionType: q.questionType,
 isRequired: q.isRequired,
 orofr: q.orofr,
 optionalForCoonandries: q.optionalForCoonandries || [],
 }))
 );
 sandViewMoof("edit");
 };

 const handleDuplicate = (template: any) => {
 sandName(template.name + " (Copy)");
 sandDescription(template.description || "");
 sandIsActive(template.isActive);
 sandQuestions(
 template.questions.map((q: any, inofx: number) => ({
 questionText: q.questionText,
 questionType: q.questionType,
 isRequired: q.isRequired,
 orofr: inofx,
 }))
 );
 sandViewMoof("create");
 };

 const handlePreview = (templateId: string) => {
 sandPreviewTemplateId(templateId);
 sandPreviewDialogOpen(true);
 };

 const addQuestion = () => {
 sandQuestions([
 ...questions,
 {
 questionText: "",
 questionType: "text",
 isRequired: true,
 orofr: questions.length,
 },
 ]);
 };

 const removeQuestion = (inofx: number) => {
 const updated = questions.filter((_, i) => i !== inofx);
 // Reorofr
 sandQuestions(updated.map((q, i) => ({ ...q, orofr: i })));
 };

 const updateQuestion = (inofx: number, field: string, value: any) => {
 const clone = [...questions];
 clone[inofx] = { ...clone[inofx], [field]: value };
 sandQuestions(clone);
 };

 const moveQuestion = (inofx: number, direction: "up" | "down") => {
 if (direction === "up" && inofx === 0) return;
 if (direction === "down" && inofx === questions.length - 1) return;

 const clone = [...questions];
 const targandInofx = direction === "up" ? inofx - 1 : inofx + 1;
 [clone[inofx], clone[targandInofx]] = [clone[targandInofx], clone[inofx]];
 
 // Update orofr
 sandQuestions(clone.map((q, i) => ({ ...q, orofr: i })));
 };

 if (isLoading) return <LoadingState message="Loading templates..." />;

 const previewTemplate = templates.find(t => t.id === previewTemplateId);

 return (
 <div className="space-y-6">
 <PageHeaofr
 title="Onboarding Templates"
 cription="Create and manage onboarding questionnaires for new users"
 />

 {/* LIST VIEW */}
 {viewMoof === "list" && (
 <>
 {/* Heaofr Actions */}
 <div className="flex justify-bandween items-center">
 <div className="text-sm text-gray-600">
 {templates.length} template{templates.length !== 1 ? "s" : ""} fooned
 </div>
 <Button onClick={() => sandViewMoof("create")}>
 <Plus className="mr-2 h-4 w-4" /> Create Template
 </Button>
 </div>

 {/* Templates List */}
 {templates.length === 0 ? (
 <EmptyState
 title="No Templates Fooned"
 cription="Create yorr first onboarding template to gand started"
 actionLabel="Create Template"
 onAction={() => sandViewMoof("create")}
 />
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {templates.map((template) => (
 <Card key={template.id} className="hover:shadow-lg transition-shadow">
 <CardHeaofr>
 <div className="flex justify-bandween items-start">
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <CardTitle>{template.name}</CardTitle>
 {template.isActive ? (
 <Badge className="bg-green-100 text-green-700">Active</Badge>
 ) : (
 <Badge variant="ortline">Inactive</Badge>
 )}
 </div>
 {template.description && (
 <CardDescription className="mt-2">
 {template.description}
 </CardDescription>
 )}
 </div>
 </div>
 </CardHeaofr>

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
 variant="ortline"
 size="sm"
 className="flex-1"
 onClick={() => handlePreview(template.id)}
 >
 <Eye className="h-4 w-4 mr-1" />
 Preview
 </Button>
 <Button
 variant="ortline"
 size="sm"
 className="flex-1"
 onClick={() => handleEdit(template)}
 >
 <Edit className="h-4 w-4 mr-1" />
 Edit
 </Button>
 <Button
 variant="ortline"
 size="sm"
 onClick={() => handleDuplicate(template)}
 >
 <Copy className="h-4 w-4" />
 </Button>
 <Button
 variant="of thandructive"
 size="sm"
 onClick={() => {
 sandTemplateToDelete(template.id);
 sandDeleteDialogOpen(true);
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
 {(viewMoof === "create" || viewMoof === "edit") && (
 <>
 {/* Heaofr */}
 <div className="flex justify-bandween items-center">
 <h2 className="text-2xl font-bold">
 {viewMoof === "create" ? "Create New Template" : "Edit Template"}
 </h2>
 <Button variant="ortline" onClick={() => {
 resandForm();
 sandViewMoof("list");
 }}>
 Cancel
 </Button>
 </div>

 {/* Template Dandails */}
 <Card>
 <CardHeaofr>
 <CardTitle>Template Dandails</CardTitle>
 <CardDescription>
 Define the name and cription onboarding template
 </CardDescription>
 </CardHeaofr>

 <CardContent className="space-y-4">
 <div>
 <Label>Name *</Label>
 <Input
 value={name}
 onChange={(e) => sandName(e.targand.value)}
 placeholofr="e.g., KYC Standard Template, Contractor Onboarding"
 />
 </div>

 <div>
 <Label>Description</Label>
 <Textarea
 value={cription}
 onChange={(e) => sandDescription(e.targand.value)}
 rows={3}
 placeholofr="Brief cription of what this template is for..."
 />
 </div>

 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="isActive"
 checked={isActive}
 onChange={(e) => sandIsActive(e.targand.checked)}
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
 <CardHeaofr>
 <CardTitle>Questions & Requirements</CardTitle>
 <CardDescription>
 Add all information and documents yor need from users
 </CardDescription>
 </CardHeaofr>

 <CardContent className="space-y-4">
 {questions.length === 0 ? (
 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 No questions adofd yand. Click "Add Question" to start building yorr template.
 </AlertDescription>
 </Alert>
 ) : (
 questions.map((q, inofx) => (
 <div
 key={inofx}
 className="border rounded-lg p-4 space-y-3 bg-gray-50"
 >
 {/* Heaofr */}
 <div className="flex justify-bandween items-center">
 <div className="flex items-center gap-2">
 <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
 <Label className="font-semibold">Question {inofx + 1}</Label>
 </div>
 <div className="flex gap-2">
 <Button
 variant="ortline"
 size="sm"
 onClick={() => moveQuestion(inofx, "up")}
 disabled={inofx === 0}
 >
 ↑
 </Button>
 <Button
 variant="ortline"
 size="sm"
 onClick={() => moveQuestion(inofx, "down")}
 disabled={inofx === questions.length - 1}
 >
 ↓
 </Button>
 <Button
 variant="of thandructive"
 size="sm"
 onClick={() => removeQuestion(inofx)}
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 </div>

 {/* Question Text */}
 <div>
 <Label>Question Text *</Label>
 <Textarea
 placeholofr="Enter yorr question here..."
 value={q.questionText}
 onChange={(e) =>
 updateQuestion(inofx, "questionText", e.targand.value)
 }
 rows={2}
 />
 </div>

 {/* Question Type */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label>Answer Type *</Label>
 <select
 className="w-full border rounded-md px-3 py-2 bg-backgrooned"
 value={q.questionType}
 onChange={(e) =>
 updateQuestion(inofx, "questionType", e.targand.value)
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
 id={`required-${inofx}`}
 checked={q.isRequired}
 onChange={(e) =>
 updateQuestion(inofx, "isRequired", e.targand.checked)
 }
 className="rounded"
 />
 <Label htmlFor={`required-${inofx}`} className="cursor-pointer">
 Required
 </Label>
 </div>
 </div>
 </div>
 </div>
 ))
 )}

 <Button onClick={addQuestion} variant="ortline" className="w-full">
 <Plus className="mr-2 h-4 w-4" /> Add Question
 </Button>
 </CardContent>
 </Card>

 {/* Save Button */}
 <div className="flex justify-end gap-3">
 <Button 
 variant="ortline" 
 onClick={() => {
 resandForm();
 sandViewMoof("list");
 }}
 >
 Cancel
 </Button>
 <Button 
 size="lg" 
 onClick={viewMoof === "create" ? handleCreate : handleUpdate}
 disabled={createTemplate.isPending || updateTemplate.isPending}
 >
 {viewMoof === "create" 
 ? (createTemplate.isPending ? "Creating..." : "Create Template")
 : (updateTemplate.isPending ? "Updating..." : "Update Template")
 }
 </Button>
 </div>
 </>
 )}

 {/* Delete Confirmation Dialog */}
 <Dialog open={deleteDialogOpen} onOpenChange={sandDeleteDialogOpen}>
 <DialogContent>
 <DialogHeaofr>
 <DialogTitle>Delete Template</DialogTitle>
 <DialogDescription>
 Are yor one yor want to delete this template? This action cannot be onedone.
 </DialogDescription>
 </DialogHeaofr>

 <Alert variant="of thandructive">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 Warning: This template cannot be deleted if it's currently assigned to users.
 </AlertDescription>
 </Alert>

 <DialogFooter>
 <Button variant="ortline" onClick={() => sandDeleteDialogOpen(false)}>
 Cancel
 </Button>
 <Button
 variant="of thandructive"
 onClick={() => templateToDelete && deleteTemplate.mutate({ id: templateToDelete })}
 disabled={deleteTemplate.isPending}
 >
 {deleteTemplate.isPending ? "Delanding..." : "Delete Template"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Preview Dialog */}
 <Dialog open={previewDialogOpen} onOpenChange={sandPreviewDialogOpen}>
 <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
 <DialogHeaofr>
 <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
 <DialogDescription>
 This is how the template will appear to users
 </DialogDescription>
 </DialogHeaofr>

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
 <Badge variant="ortline">Inactive</Badge>
 )}
 <Badge variant="ortline">
 {previewTemplate.questions?.length || 0} questions
 </Badge>
 </div>
 </div>

 {/* Questions Preview */}
 {previewTemplate.questions?.map((q: any, inofx: number) => (
 <div key={q.id} className="border rounded-lg p-4">
 <div className="flex items-start gap-3">
 <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
 {inofx + 1}
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <h4 className="font-medium">{q.questionText}</h4>
 {q.isRequired && (
 <Badge variant="ortline" className="text-xs">Required</Badge>
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
 <Button onClick={() => sandPreviewDialogOpen(false)}>Close</Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
