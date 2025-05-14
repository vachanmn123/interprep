/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { api } from "@/trpc/react";

interface TestContainerProps {
  credentialToken: string;
}

export default function TestContainer({ credentialToken }: TestContainerProps) {
  const router = useRouter();
  const [test, setTest] = useState<
    | (Test & {
        questions: (Question & { options: QuestionOption[] })[];
      })
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<
      string,
      {
        response: string | number | boolean | string[] | null;
        timeTaken: number;
      }
    >
  >({});
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [proctoringWarnings, setProctoringWarnings] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<
    | "not_started"
    | "camera_permission"
    | "pre_test"
    | "in_progress"
    | "completed"
    | "failed"
  >("not_started");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const proctoringService = useRef<ProctoringService | null>(null);

  // tRPC mutations
  const startAttemptMutation = api.test.startAttempt.useMutation();
  const completeAttemptMutation = api.test.completeAttempt.useMutation();
  const failAttemptMutation = api.test.failAttempt.useMutation();

  // Handle test failure due to malpractice
  const handleTestFailure = useCallback(
    async (reason: string) => {
      // Only process failure if the test is actually in progress
      if (testStatus !== "in_progress") return;

      setTestStatus("failed");

      try {
        // Call the tRPC endpoint to save the failed attempt
        await failAttemptMutation.mutateAsync({
          attemptId: testAttempt?.id ?? "",
          reason,
          credentialToken,
        });

        // Redirect to failure page
        router.push(`/test-failed?reason=${encodeURIComponent(reason)}`);
      } catch (error) {
        console.error("Error handling test failure:", error);
      }
    },
    [testStatus, testAttempt, credentialToken, router, failAttemptMutation],
  );

  // Handle test completion
  const handleTestEnd = useCallback(async () => {
    if (testStatus !== "in_progress") return;

    setTestStatus("completed");

    try {
      // Call the tRPC endpoint to save the completed attempt
      await completeAttemptMutation.mutateAsync({
        attemptId: testAttempt?.id ?? "",
        answers,
        credentialToken,
      });

      // Redirect to completion page
      router.push("/test-completed");
    } catch (error) {
      console.error("Error completing test:", error);
    }
  }, [
    testStatus,
    testAttempt,
    answers,
    credentialToken,
    router,
    completeAttemptMutation,
  ]);

  // Handle proctoring violations
  const handleProctoringViolation = useCallback(
    (violationType: string) => {
      // Only process violations if the test is actually in progress
      if (testStatus !== "in_progress") return;

      const warning = `Proctoring violation detected: ${violationType}`;
      setProctoringWarnings((prev) => [...prev, warning]);

      // If this is a severe violation or there are multiple violations, end the test
      if (violationType === "severe" || proctoringWarnings.length >= 2) {
        void handleTestFailure("Malpractice detected");
      }
    },
    [testStatus, proctoringWarnings.length, handleTestFailure],
  );

  // Get test data using tRPC
  const { data: testResult } = api.test.getByCredential.useQuery({
    credentialToken,
  });

  // Fetch test data
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        if (!testResult) return;
        if (testResult.test) {
          if (test) return; // Test already loaded
          setTest(testResult.test);

          // Start test attempt
          const attemptResult = await startAttemptMutation.mutateAsync({
            testId: testResult.test.id,
            credentialToken,
          });

          if (!attemptResult) {
            throw new Error("Failed to start test attempt");
          }
          if (testAttempt) return; // Attempt already loaded
          setTestAttempt(attemptResult.attempt);

          // Calculate time remaining if test has an expiration
          if (testResult.test.expiresAt) {
            const expiresAt = new Date(testResult.test.expiresAt).getTime();
            const now = new Date().getTime();
            setTimeRemaining(Math.max(0, Math.floor((expiresAt - now) / 1000)));
          }
        }
      } catch (error) {
        console.error("Error fetching test:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchTestData();
  }, [credentialToken, startAttemptMutation, test, testAttempt, testResult]);

  // Handle answer submission for current question
  const handleAnswerSubmit = (
    questionId: string,
    answer: string | number | boolean | string[],
    timeTaken: number,
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        response: answer,
        timeTaken,
      },
    }));

    // Move to next question if available
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // If this was the last question, end the test
      void handleTestEnd();
    }
  };

  // Request camera permissions
  const requestCameraPermission = async () => {
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
  };

  // Update the handleStartTest function
  const handleStartTest = () => {
    setTestStatus("camera_permission");
  };

  // Add a function to start the actual test
  const startProctoring = () => {
    // Stop the preview stream before starting the test
    // The proctoring service will create its own stream
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    // Clear any warnings that might have been triggered during setup
    setProctoringWarnings([]);

    // Start the test
    setTestStatus("in_progress");
  };

  // Initialize proctoring
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (test && testStatus === "in_progress") {
      proctoringService.current = new ProctoringService({
        onViolation: handleProctoringViolation,
        testId: test.id,
        attemptId: testAttempt?.id ?? "",
      });

      // Timer for test countdown
      if (timeRemaining !== null) {
        timer = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(timer);
              void handleTestEnd();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (timer) clearInterval(timer);
      if (proctoringService.current) {
        // Clean up proctoring service if needed
        proctoringService.current = null;
      }
    };
  }, [
    test,
    testStatus,
    testAttempt,
    timeRemaining,
    handleTestEnd,
    handleProctoringViolation,
  ]);

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

  if (testStatus === "not_started") {
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
  }

  if (testStatus === "camera_permission") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Camera Permission Required
            </CardTitle>
            <CardDescription>
              This test requires access to your camera for proctoring purposes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cameraError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{cameraError}</p>
              </div>
            )}
            <p className="mb-4">
              Please allow access to your camera when prompted. Your camera feed
              will only be used for proctoring and will not be recorded or
              stored.
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
  }

  if (testStatus === "pre_test") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Ready to Begin</CardTitle>
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
                <li>The test contains {test?.questions.length} questions</li>
              </ul>
            </div>

            <div className="mb-4 rounded-md bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Once you start the test, proctoring
                will begin. Leaving the test window, using keyboard shortcuts,
                or other suspicious activities may be flagged as malpractice.
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
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div className="container mx-auto max-w-4xl p-4">
      {/* Header with progress and time */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{test.title}</h1>
            <p className="text-muted-foreground text-sm">
              Question {currentQuestionIndex + 1} of {test.questions.length}
            </p>
          </div>
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
          question={currentQuestion}
          onSubmit={(answer, timeTaken) =>
            // @ts-expect-error - It's a workaround for the type error
            handleAnswerSubmit(currentQuestion.id, answer, timeTaken)
          }
          timeLimit={currentQuestion.timeLimit}
        />
      )}
    </div>
  );
}
