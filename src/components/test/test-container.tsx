"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Clock } from "lucide-react";
import QuestionRenderer from "./question-renderer";
import ProctoringService from "@/lib/proctoring-service";
import type { Question, QuestionOption, Test, TestAttempt } from "@/types/test";
import CameraPreview from "./camera-preview";
import CameraPreviewToggle from "./camera-preview-toggle";
import { api } from "@/trpc/react";
import type { TRPCError } from "@trpc/server";

interface TestContainerProps {
  credentialToken: string;
}

type TestStatus =
  | "not_started"
  | "camera_permission"
  | "pre_test"
  | "in_progress"
  | "completed"
  | "failed";

type AnswerRecord = Record<
  string,
  {
    response: string | number | boolean | string[] | null;
    timeTaken: number;
  }
>;

export default function TestContainer({ credentialToken }: TestContainerProps) {
  const router = useRouter();

  // State management
  const [test, setTest] = useState<
    (Test & { questions: (Question & { options: QuestionOption[] })[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord>({});
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [proctoringWarnings, setProctoringWarnings] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<TestStatus>("not_started");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraPreviewVisible, setIsCameraPreviewVisible] = useState(true);

  // Refs
  const proctoringService = useRef<ProctoringService | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isTestActive = useRef(false);

  // tRPC queries and mutations
  const {
    data: testResult,
    isLoading: isTestLoading,
    error,
  } = api.test.getByCredential.useQuery(
    { credentialToken },
    { refetchOnWindowFocus: false },
  );

  const startAttemptMutation = api.test.startAttempt.useMutation();
  const completeAttemptMutation = api.test.completeAttempt.useMutation();
  const failAttemptMutation = api.test.failAttempt.useMutation();

  // Memoized values
  const currentQuestion = useMemo(
    () => test?.questions[currentQuestionIndex] ?? null,
    [test, currentQuestionIndex],
  );

  const progress = useMemo(
    () =>
      test ? ((currentQuestionIndex + 1) / test.questions.length) * 100 : 0,
    [currentQuestionIndex, test],
  );

  // Clean up resources - defined once and stable
  const cleanupResources = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (proctoringService.current) {
      proctoringService.current.cleanup();
      proctoringService.current = null;
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    isTestActive.current = false;
  }, [cameraStream]);

  // Handle test failure due to malpractice
  const handleTestFailure = useCallback(
    async (reason: string) => {
      if (testStatus !== "in_progress" || !isTestActive.current) return;

      isTestActive.current = false;
      setTestStatus("failed");
      cleanupResources();

      try {
        if (testAttempt?.id) {
          await failAttemptMutation.mutateAsync({
            attemptId: testAttempt.id,
            reason,
            credentialToken,
          });
        }
        router.push(`/test-failed?reason=${encodeURIComponent(reason)}`);
      } catch (error) {
        console.error("Error handling test failure:", error);
        router.push(
          `/test-failed?reason=${encodeURIComponent(reason)}&apiError=true`,
        );
      }
    },
    [
      testStatus,
      testAttempt,
      credentialToken,
      router,
      failAttemptMutation,
      cleanupResources,
    ],
  );

  // Handle test completion
  const handleTestEnd = useCallback(
    async (finalAnswers = answers) => {
      if (testStatus !== "in_progress" || !isTestActive.current) return;

      isTestActive.current = false;
      setTestStatus("completed");
      cleanupResources();

      try {
        if (testAttempt?.id) {
          await completeAttemptMutation.mutateAsync({
            attemptId: testAttempt.id,
            answers: finalAnswers,
            credentialToken,
          });
        }
        router.push("/test-completed");
      } catch (error) {
        console.error("Error completing test:", error);
      }
    },
    [
      testStatus,
      testAttempt,
      answers,
      credentialToken,
      router,
      completeAttemptMutation,
      cleanupResources,
    ],
  );

  // Handle proctoring violations - stable reference
  const handleProctoringViolation = useCallback(
    (violationType: string, _details: unknown) => {
      if (testStatus !== "in_progress" || !isTestActive.current) return;

      const warning = `Proctoring violation detected: ${violationType}`;
      setProctoringWarnings((prev) => [...prev, warning]);

      // If this is a severe violation or there are multiple violations, end the test
      if (violationType === "severe" || proctoringWarnings.length >= 2) {
        void handleTestFailure("Malpractice detected");
      }
    },
    [testStatus, proctoringWarnings.length, handleTestFailure],
  );

  // Initialize test data - runs only when test data is loaded
  useEffect(() => {
    const initializeTest = async () => {
      if (isTestLoading || !testResult?.test || test) return;

      try {
        setTest(testResult.test);

        // Start test attempt
        const attemptResult = await startAttemptMutation.mutateAsync({
          testId: testResult.test.id,
          credentialToken,
        });

        if (!attemptResult) {
          router.push("/test-failed?reason=Failed to start test attempt");
          throw new Error("Failed to start test attempt");
        }

        setTestAttempt(attemptResult.attempt);

        // Calculate time remaining if test has an expiration
        if (testResult.test.expiresAt) {
          const expiresAt = new Date(testResult.test.expiresAt).getTime();
          const now = new Date().getTime();
          setTimeRemaining(Math.max(0, Math.floor((expiresAt - now) / 1000)));
        }
      } catch (error: unknown) {
        console.error("Error initializing test:", error);
        router.push(`/test-failed?reason=${(error as TRPCError).message}`);
      } finally {
        setLoading(false);
      }
    };

    void initializeTest();
  }, [
    credentialToken,
    isTestLoading,
    router,
    startAttemptMutation,
    test,
    testResult,
  ]);

  // Initialize timer and proctoring - only when test status changes to in_progress
  useEffect(() => {
    if (test && testStatus === "in_progress") {
      isTestActive.current = true;

      // Initialize proctoring service only once
      if (!proctoringService.current && testAttempt?.id) {
        proctoringService.current = new ProctoringService({
          onViolation: handleProctoringViolation,
          testId: test.id,
          attemptId: testAttempt.id,
        });
      }

      // Timer for test countdown, only set up if not already running
      if (timeRemaining !== null && !timerRef.current) {
        timerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev === null || prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              void handleTestEnd();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      // Only clean up when component unmounts or test status changes from in_progress
      if (testStatus !== "in_progress") {
        cleanupResources();
      }
    };
  }, [
    cleanupResources,
    handleProctoringViolation,
    handleTestEnd,
    test,
    testAttempt?.id,
    testStatus,
    timeRemaining,
  ]);

  // Handle answer submission for current question
  const handleAnswerSubmit = useCallback(
    async (
      questionId: string,
      answer: string | number | boolean | string[],
      timeTaken: number,
    ) => {
      if (!isTestActive.current) return;

      // Create the updated answers object first
      const updatedAnswers = {
        ...answers,
        [questionId]: {
          response: answer,
          timeTaken,
        },
      };

      // Update the state
      setAnswers(updatedAnswers);

      // Move to next question if available
      if (test && currentQuestionIndex < test.questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        // If this was the last question, end the test with the updated answers
        await handleTestEnd(updatedAnswers);
      }
    },
    [currentQuestionIndex, test, handleTestEnd, answers],
  );

  // Request camera permissions
  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      setCameraStream(stream);
      setCameraError(null);
      setTestStatus("pre_test");
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError(
        "Unable to access your camera. Please ensure your camera is connected and you've granted permission.",
      );
    }
  }, []);

  // Start the test flow
  const handleStartTest = useCallback(() => {
    setTestStatus("camera_permission");
  }, []);

  // Start proctoring and begin the test
  const startProctoring = useCallback(() => {
    // Clear any warnings that might have been triggered during setup
    setProctoringWarnings([]);

    // Start the test
    setTestStatus("in_progress");
  }, []);

  // Error handling
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md p-6">
          <h1 className="mb-4 text-xl font-bold">Error Loading Test</h1>
          <p>{error.message}</p>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p>Loading your test...</p>
        </div>
      </div>
    );
  }

  // Test not found
  if (!test) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md p-6">
          <h1 className="mb-4 text-xl font-bold">Test Not Found</h1>
          <p>
            The test you&apos;re looking for doesn&apos;t exist or has expired.
          </p>
        </Card>
      </div>
    );
  }

  // Render appropriate UI based on test status
  switch (testStatus) {
    case "not_started":
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h1 className="mb-4 text-2xl font-bold">{test.title}</h1>
            <div className="mb-6">
              <p className="mb-2">This test is proctored. Before starting:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Ensure you&apos;re in a quiet environment</li>
                <li>Close all other applications and browser tabs</li>
                <li>Your webcam will be used for proctoring</li>
                <li>Leaving the test window may be flagged as malpractice</li>
                <li>The test contains {test.questions.length} questions</li>
              </ul>
            </div>
            <Button onClick={handleStartTest} className="w-full">
              Start Test
            </Button>
          </Card>
        </div>
      );

    case "camera_permission":
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Camera Permission Required
              </CardTitle>
              <CardDescription>
                This test requires access to your camera for proctoring
                purposes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cameraError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{cameraError}</p>
                </div>
              )}
              <p className="mb-4">
                Please allow access to your camera when prompted. Your camera
                feed will only be used for proctoring and will not be recorded
                or stored.
              </p>
              <div className="flex justify-center">
                <Button onClick={requestCameraPermission}>
                  Allow Camera Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case "pre_test":
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Ready to Begin
              </CardTitle>
              <CardDescription>
                Your camera is now set up for proctoring.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="mb-2 font-medium">Camera Preview:</p>
                <div className="relative h-48 w-full overflow-hidden rounded-md bg-gray-100">
                  {cameraStream ? (
                    <CameraPreview stream={cameraStream} />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-gray-500">
                        Camera preview unavailable
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-2 font-medium">Before you begin:</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  <li>Ensure you&apos;re in a well-lit, quiet environment</li>
                  <li>Close all other applications and browser tabs</li>
                  <li>Have your ID ready if required</li>
                  <li>Make sure your face is clearly visible in the camera</li>
                  <li>The test contains {test.questions.length} questions</li>
                </ul>
              </div>

              <div className="mb-4 rounded-md bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> Once you start the test,
                  proctoring will begin. Leaving the test window, using keyboard
                  shortcuts, or other suspicious activities may be flagged as
                  malpractice.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={startProctoring} className="w-full">
                Start Test Now
              </Button>
            </CardFooter>
          </Card>
        </div>
      );

    case "in_progress":
      return (
        <div className="relative container mx-auto max-w-4xl p-4">
          {/* Header with progress and time */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">{test.title}</h1>
                <p className="text-muted-foreground text-sm">
                  Question {currentQuestionIndex + 1} of {test.questions.length}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {cameraStream && (
                  <CameraPreviewToggle
                    isVisible={isCameraPreviewVisible}
                    onToggle={setIsCameraPreviewVisible}
                  />
                )}
                {timeRemaining !== null && (
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>
                      {Math.floor(timeRemaining / 60)}:
                      {(timeRemaining % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Proctoring warnings */}
          {proctoringWarnings.length > 0 && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
              <div className="flex items-start">
                <AlertCircle className="mt-0.5 mr-2 h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">Proctoring Warning</p>
                  <ul className="mt-1 text-sm text-red-700">
                    {proctoringWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Current question */}
          {currentQuestion && (
            <QuestionRenderer
              key={currentQuestion.id}
              question={currentQuestion}
              onSubmit={(answer, timeTaken) =>
                handleAnswerSubmit(
                  currentQuestion.id,
                  answer as string | number | boolean | string[],
                  timeTaken,
                )
              }
              timeLimit={currentQuestion.timeLimit}
            />
          )}

          {/* Camera preview */}
          {cameraStream && isCameraPreviewVisible && (
            <div className="fixed right-4 bottom-4 z-50 h-32 w-48 overflow-hidden rounded-md border border-gray-300 shadow-md">
              <CameraPreview stream={cameraStream} />
              <div className="absolute right-0 bottom-0 left-0 bg-black/50 p-1 text-center text-xs text-white">
                Camera Preview
              </div>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}
