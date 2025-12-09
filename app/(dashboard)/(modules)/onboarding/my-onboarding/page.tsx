"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Circle, Upload, FileText } from "lucide-react";
import { api } from "@/lib/trpc";
import { LoadingState } from "@/components/shared/loading-state";
import { toast } from "sonner";

export default function ContractorOnboardingPage() {
  const { data, isLoading, refetch } = api.onboarding.getMyOnboardingResponses.useQuery();

  const startMutation = api.onboarding.startOnboarding.useMutation({
    onSuccess: () => refetch(),
  });

  const submitMutation = api.onboarding.submitResponse.useMutation({
    onSuccess: () => {
      toast.success("Réponse envoyée !");
      refetch();
      setOpenTextModal(false);
      setOpenFileModal(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const [openTextModal, setOpenTextModal] = useState(false);
  const [openFileModal, setOpenFileModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [textValue, setTextValue] = useState("");

  const [file, setFile] = useState<File | null>(null);

  if (isLoading) return <LoadingState message="Chargement..." />;

  // ------------------------------
  // 1️⃣ NO ONBOARDING STARTED
  // ------------------------------
  if (!data || !data.onboardingTemplate) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Onboarding"
          description="Commencez votre onboarding pour activer votre compte"
        />

        <Card className="p-10 flex flex-col items-center text-center space-y-4">
          <h2 className="text-xl font-semibold">Aucun onboarding trouvé</h2>
          <p className="text-muted-foreground max-w-md">
            Vous devez commencer votre processus d’onboarding avant de pouvoir accéder à la plateforme.
          </p>

          <Button size="lg" className="mt-4" onClick={() => startMutation.mutate()}>
            🚀 Start Onboarding
          </Button>
        </Card>
      </div>
    );
  }

  // ------------------------------
  // 2️⃣ ONBOARDING EXISTS
  // ------------------------------
  const template = data.onboardingTemplate;
  const responses = data.onboardingResponses || [];

  const totalQuestions = template.questions.length;
  const approved = responses.filter((r) => r.status === "approved").length;
  const progress = Math.round((approved / totalQuestions) * 100);

  const getStatusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="h-6 w-6 text-green-600" />;
    if (status === "pending") return <Circle className="h-6 w-6 animate-pulse text-blue-600" />;
    if (status === "rejected") return <Circle className="h-6 w-6 text-red-600" />;
    return <Circle className="h-6 w-6 text-muted-foreground" />;
  };

  const openText = (q: any) => {
    setCurrentQuestion(q);
    setTextValue("");
    setOpenTextModal(true);
  };

  const openFile = (q: any) => {
    setCurrentQuestion(q);
    setFile(null);
    setOpenFileModal(true);
  };

  const handleSubmitText = () => {
    submitMutation.mutate({
      questionId: currentQuestion.id,
      responseText: textValue,
    });
  };

  const handleSubmitFile = async () => {
    if (!file) return toast.error("Choisissez un fichier");

    // 🚨 Ici tu devras ajouter ton upload S3 ou Storage
    const fakePath = file.name;

    submitMutation.mutate({
      questionId: currentQuestion.id,
      responseFilePath: fakePath,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Onboarding"
        description="Complete your onboarding process and upload required documents"
      />

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Progress</CardTitle>
          <CardDescription>
            {approved} of {totalQuestions} steps validated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
          <CardDescription>Submit the requested information</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {template.questions.map((q) => {
            const r = responses.find((x) => x.questionId === q.id);

            return (
              <div key={q.id} className="border rounded-lg p-4 flex gap-4">
                <div>{getStatusIcon(r?.status || "missing")}</div>

                <div className="flex-1">
                  <h3 className="font-semibold">{q.questionText}</h3>
                  <p className="text-sm text-muted-foreground">{q.questionType}</p>

                  {/* Existing response */}
                  {r?.responseText && <p className="mt-2 text-sm">{r.responseText}</p>}

                  {r?.responseFilePath && (
                    <Button variant="outline" size="sm" className="mt-2">
                      <FileText className="h-4 w-4 mr-2" />
                      View File
                    </Button>
                  )}

                  {/* Missing response */}
                  {(!r || (!r.responseText && !r.responseFilePath)) && (
                    <>
                      {q.questionType === "text" && (
                        <Button size="sm" variant="outline" className="mt-3" onClick={() => openText(q)}>
                          Provide Text Answer
                        </Button>
                      )}

                      {q.questionType === "file" && (
                        <Button size="sm" className="mt-3" onClick={() => openFile(q)}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload File
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* TEXT MODAL */}
      <Dialog open={openTextModal} onOpenChange={setOpenTextModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentQuestion?.questionText}</DialogTitle>
          </DialogHeader>

          <Textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Write your answer..."
          />

          <Button className="w-full mt-4" onClick={handleSubmitText}>
            Submit Answer
          </Button>
        </DialogContent>
      </Dialog>

      {/* FILE MODAL */}
      <Dialog open={openFileModal} onOpenChange={setOpenFileModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentQuestion?.questionText}</DialogTitle>
          </DialogHeader>

          <Input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <Button className="w-full mt-4" onClick={handleSubmitFile}>
            Upload File
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
