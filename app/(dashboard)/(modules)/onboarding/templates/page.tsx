"use client";

import { useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateOnboardingTemplatePage() {
  const [name, setName] = useState("KYC Standard Template");
  const [description, setDescription] = useState("Standard onboarding & KYC verification");
  const [questions, setQuestions] = useState<
    { questionText: string; questionType: "text" | "file" }[]
  >([
    // SECTION 1 — Basic Identity
    { questionText: "Please confirm your full name", questionType: "text" },
    { questionText: "Please confirm your phone number", questionType: "text" },
    { questionText: "What is your current address?", questionType: "text" },

    // SECTION 2 — KYC Documents
    { questionText: "Upload your ID card or passport (front)", questionType: "file" },
    { questionText: "Upload your ID card or passport (back)", questionType: "file" },
    { questionText: "Upload a selfie holding your ID", questionType: "file" },

    // SECTION 3 — Contractor Profile
    { questionText: "Upload your resume", questionType: "file" },
    { questionText: "List your main skills", questionType: "text" },
    { questionText: "Describe your work experience", questionType: "text" },
  ]);

  const createTemplate = api.onboardingTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", questionType: "text" },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const clone = [...questions];
    clone[index] = { ...clone[index], [field]: value };
    setQuestions(clone);
  };

  const handleCreate = () => {
    if (!name.trim()) return toast.error("Template name is required");

    if (questions.some((q) => !q.questionText.trim())) {
      return toast.error("All questions must have text");
    }

    createTemplate.mutate({
      name,
      description,
      questions,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Onboarding Template"
        description="Build a KYC onboarding workflow for your contractors"
      />

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
              placeholder="Template name"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KYC Questions</CardTitle>
          <CardDescription>
            Add all steps required for this onboarding process
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {questions.map((q, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-center">
                <Label>Question {index + 1}</Label>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeQuestion(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Input
                placeholder="Enter question text"
                value={q.questionText}
                onChange={(e) =>
                  updateQuestion(index, "questionText", e.target.value)
                }
              />

              <div className="flex gap-4 items-center">
                <Label>Answer Type:</Label>

                <select
                  className="border rounded px-3 py-2 bg-background"
                  value={q.questionType}
                  onChange={(e) =>
                    updateQuestion(index, "questionType", e.target.value)
                  }
                >
                  <option value="text">Text Answer</option>
                  <option value="file">File Upload</option>
                </select>
              </div>
            </div>
          ))}

          <Button onClick={addQuestion} className="w-full mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </CardContent>
      </Card>

      <Button size="lg" className="w-full" onClick={handleCreate}>
        Create Template
      </Button>
    </div>
  );
}
