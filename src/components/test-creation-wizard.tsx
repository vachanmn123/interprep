"use client";
import { useState } from "react";
import {
  DialogTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ArrowLeft, Check, Loader2, Plus } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { api } from "@/trpc/react";
import QuestionPreviewCard from "./question-preview-card";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

export type Question = {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  answer?: boolean;
  text: string;
  maxScore: number;
  timeLimit?: number;
  options?: {
    label: string;
    isCorrect: boolean;
  }[];
};

export default function TestCreationDialog({
  candidateId,
}: {
  candidateId: string;
}) {
  const utils = api.useUtils();
  const [step, setStep] = useState(0);
  const [testType, setTestType] = useState<"HR" | "Technical" | null>(null);
  const [testTitle, setTestTitle] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [open, setOpen] = useState(false);

  const {
    data: questions,
    isLoading: questionsLoading,
    error: questionsError,
  } = api.candidate.generateCandidateTest.useQuery(
    {
      id: candidateId,
      testType: testType ?? "HR",
    },
    {
      enabled: !!testType && step === 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
    },
  );

  const { mutate: createTest, isPending: isCreating } =
    api.candidate.createCandidateTest.useMutation({
      onSuccess: async () => {
        await utils.candidate.getCandidate.invalidate({ id: candidateId });
        setOpen(false);
      },
      onError: (error) => {
        console.error("Error creating test:", error);
      },
    });

  const resetForm = () => {
    setStep(0);
    setTestType(null);
    setTestTitle("");
    setExpiryDate(null);
    setSelectedQuestions([]);
  };

  const steps = [
    { name: "Test Type", description: "Select the type of test" },
    { name: "Test Info", description: "Enter test details" },
    { name: "Questions", description: "Select test questions" },
    { name: "Summary", description: "Review and create" },
  ];

  const totalMarks = selectedQuestions.reduce(
    (acc, question) => acc + question.maxScore,
    0,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(op) => {
        if (!op) {
          resetForm();
        }
        setOpen(op);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Create Test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] min-w-[85vw] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle>Create a new test</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex justify-between">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`flex flex-col items-center ${i <= step ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "border-primary"
                        : "border-muted"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="mt-1 text-xs font-medium">{s.name}</span>
              </div>
            ))}
          </div>
          <div className="relative mt-2">
            <div className="bg-muted absolute top-0 h-1 w-full"></div>
            <div
              className="bg-primary absolute top-0 h-1 transition-all duration-300"
              style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex flex-col gap-6">
          {step === 0 && (
            <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-6">
              <h2 className="text-xl font-semibold">Select Test Type</h2>
              <p className="text-muted-foreground text-center">
                Choose the type of test you want to create for the candidate
              </p>
              <div className="grid w-full grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${testType === "HR" ? "border-primary ring-primary/20 ring-2" : "hover:border-primary/50"}`}
                  onClick={() => setTestType("HR")}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="bg-primary/10 mb-2 rounded-full p-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <h3 className="font-medium">HR Test</h3>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-all ${testType === "Technical" ? "border-primary ring-primary/20 ring-2" : "hover:border-primary/50"}`}
                  onClick={() => setTestType("Technical")}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="bg-primary/10 mb-2 rounded-full p-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <path d="m18 16 4-4-4-4"></path>
                        <path d="m6 8-4 4 4 4"></path>
                        <path d="m14.5 4-5 16"></path>
                      </svg>
                    </div>
                    <h3 className="font-medium">Technical Test</h3>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mx-auto flex w-full max-w-md flex-col gap-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{testType} Test</Badge>
              </div>

              <h2 className="text-xl font-semibold">Test Information</h2>
              <p className="text-muted-foreground">
                Enter the details for your test
              </p>

              <div className="space-y-2">
                <Label htmlFor="test-title">Test Title</Label>
                <Input
                  type="text"
                  id="test-title"
                  placeholder="Enter a descriptive title"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={
                    expiryDate ? expiryDate.toISOString().split("T")[0] : ""
                  }
                  required
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setExpiryDate(new Date(e.target.value))}
                />
                <p className="text-muted-foreground text-xs">
                  The test will expire at midnight on this date
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex w-full flex-col gap-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{testType} Test</Badge>
                <Badge variant="outline">{testTitle}</Badge>
                <Badge variant="outline">
                  Expires: {expiryDate?.toLocaleDateString()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Select Questions</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Selected: {selectedQuestions.length}
                  </Badge>
                  <Badge variant="secondary">Total Marks: {totalMarks}</Badge>
                </div>
              </div>

              {questionsLoading ? (
                <div className="flex h-40 w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6">
                  <Loader2 className="text-primary h-8 w-8 animate-spin" />
                  <p className="text-muted-foreground">
                    Generating questions...
                  </p>
                </div>
              ) : questionsError ? (
                <div className="border-destructive text-destructive flex h-40 w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6">
                  <p>Error generating questions: {questionsError.message}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      void utils.candidate.generateCandidateTest.refetch({
                        id: candidateId,
                        testType: testType ?? "HR",
                      });
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {questions?.map((question, index) => (
                    <div
                      key={index}
                      className={`relative cursor-pointer rounded-lg transition-all ${
                        selectedQuestions.some((q) => q.text === question.text)
                          ? "ring-primary ring-2"
                          : "hover:ring-primary/50 hover:ring-1"
                      }`}
                      onClick={() => {
                        const isSelected = selectedQuestions.some(
                          (q) => q.text === question.text,
                        );

                        if (isSelected) {
                          setSelectedQuestions((prev) =>
                            prev.filter((q) => q.text !== question.text),
                          );
                        } else {
                          setSelectedQuestions((prev) => [...prev, question]);
                        }
                      }}
                    >
                      {selectedQuestions.some(
                        (q) => q.text === question.text,
                      ) && (
                        <div className="bg-primary absolute top-2 right-2 z-10 rounded-full p-1">
                          <Check className="text-primary-foreground h-4 w-4" />
                        </div>
                      )}
                      <QuestionPreviewCard question={question} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex w-full flex-col gap-6">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-medium">Test Details</h3>
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Test Type:</span>
                    <Badge variant="outline">{testType}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Test Title:</span>
                    <span>{testTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Expiry Date:</span>
                    <span>{expiryDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Total Marks:</span>
                    <span>{totalMarks}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Selected Questions ({selectedQuestions.length})
                  </h3>
                  <Badge variant="secondary">Total Marks: {totalMarks}</Badge>
                </div>

                <div className="max-h-[400px] space-y-4 overflow-y-auto pr-2">
                  {selectedQuestions.map((question, index) => (
                    <div key={index} className="relative">
                      <Badge className="absolute top-2 right-2 z-10">
                        {question.maxScore} marks
                      </Badge>
                      <QuestionPreviewCard question={question} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <Button
              variant="outline"
              onClick={() => setStep((prev) => prev - 1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <Button
              onClick={() => setStep((prev) => prev + 1)}
              disabled={
                (step === 0 && !testType) ||
                (step === 1 && (!testTitle || !expiryDate)) ||
                (step === 2 && selectedQuestions.length === 0)
              }
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={() => {
                createTest({
                  candidateId,
                  testType: testType ?? "HR",
                  testTitle,
                  expiryDate: expiryDate!,
                  questions: selectedQuestions,
                });
              }}
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Test"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
