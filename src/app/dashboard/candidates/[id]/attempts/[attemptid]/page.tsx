import { api } from "@/trpc/server";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  FileText,
  Award,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default async function AttemptInfo({
  params,
}: {
  params: Promise<{
    id: string;
    attemptid: string;
  }>;
}) {
  const { attemptid } = await params;
  const attempt = await api.candidate.getTestAttempt({ attemptId: attemptid });

  if (!attempt) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h2 className="mt-4 text-2xl font-bold">Test attempt not found</h2>
          <p className="text-muted-foreground mt-2">
            The test attempt you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  const {
    test,
    candidate,
    answers,
    status,
    startedAt,
    completedAt,
    totalScore,
  } = attempt;
  const totalQuestions = test.questions.length;
  const answeredQuestions = answers.length;
  const percentComplete = Math.round(
    (answeredQuestions / totalQuestions) * 100,
  );

  // Calculate time spent
  const startTime = new Date(startedAt);
  const endTime = completedAt ? new Date(completedAt) : new Date();
  const timeSpentMs = endTime.getTime() - startTime.getTime();
  const timeSpentMinutes = Math.floor(timeSpentMs / 60000);
  const timeSpentSeconds = Math.floor((timeSpentMs % 60000) / 1000);

  // Calculate score percentage if available
  const maxPossibleScore = test.questions.reduce(
    (total, q) => total + q.maxScore,
    0,
  );
  const scorePercentage =
    totalScore !== null && totalScore !== undefined
      ? Math.round((totalScore / maxPossibleScore) * 100)
      : null;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{test.title} - Attempt Details</h1>
        <StatusBadge status={status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Candidate Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Candidate Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{candidate.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{candidate.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Test Type:</span>
                <Badge variant="outline">{test.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Questions:</span>
                <span>{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Expires:</span>
                <span>{format(new Date(test.expiresAt), "PPP")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attempt Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Attempt Summary
          </CardTitle>
          <CardDescription>
            Overview of the candidate&apos;s performance on this test
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-muted-foreground text-sm">
                    {answeredQuestions} of {totalQuestions} questions
                  </span>
                </div>
                <Progress value={percentComplete} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Started:</span>
                  <span>{format(startTime, "PPp")}</span>
                </div>
                {completedAt && (
                  <div className="flex justify-between">
                    <span className="font-medium">Completed:</span>
                    <span>{format(new Date(completedAt), "PPp")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Time Spent:</span>
                  <span>
                    {timeSpentMinutes}m {timeSpentSeconds}s
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-2">
              {scorePercentage !== null ? (
                <>
                  <div className="text-4xl font-bold">
                    {totalScore} / {maxPossibleScore}
                  </div>
                  <div className="text-muted-foreground text-2xl font-semibold">
                    {scorePercentage}%
                  </div>
                  <Badge
                    className="mt-2"
                    variant={scorePercentage >= 70 ? "default" : "destructive"}
                  >
                    {scorePercentage >= 70 ? "PASSED" : "FAILED"}
                  </Badge>
                </>
              ) : (
                <div className="text-muted-foreground text-center">
                  {status === "SUBMITTED"
                    ? "Awaiting evaluation"
                    : "Test not completed"}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answers Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Question Responses</CardTitle>
          <CardDescription>
            Detailed breakdown of each question and the candidate&apos;s
            response
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {test.questions.map((question, index) => {
              const answer = answers.find((a) => a.questionId === question.id);

              return (
                <div key={question.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Question {index + 1}: {question.type}
                    </h3>
                    {answer && (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={answer.isCorrect ? "default" : "destructive"}
                        >
                          {answer.score} / {question.maxScore}
                        </Badge>
                        <span className="text-muted-foreground flex items-center text-sm">
                          <Clock className="mr-1 h-4 w-4" />
                          {Math.floor(answer.timeTaken / 60)}m{" "}
                          {answer.timeTaken % 60}s
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="mb-4">{question.text}</p>

                  {answer ? (
                    <div className="space-y-2">
                      <Separator />
                      <h4 className="font-medium">Response:</h4>

                      {question.type === "MULTIPLE_CHOICE" && (
                        <div className="space-y-2">
                          {question.options.map((option) => {
                            const selectedOptionIds =
                              answer.selectedOptionIds as string[];
                            const isSelected = selectedOptionIds?.includes(
                              option.id,
                            );

                            return (
                              <div
                                key={option.id}
                                className={`flex items-center rounded-md p-2 ${
                                  isSelected
                                    ? option.isCorrect
                                      ? "bg-green-50 dark:bg-green-950"
                                      : "bg-red-50 dark:bg-red-950"
                                    : ""
                                }`}
                              >
                                {isSelected ? (
                                  option.isCorrect ? (
                                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                                  ) : (
                                    <XCircle className="mr-2 h-5 w-5 text-red-500" />
                                  )
                                ) : (
                                  <div className="mr-2 h-5 w-5" />
                                )}
                                <span>{option.label}</span>
                                {option.isCorrect && !isSelected && (
                                  <Badge variant="outline" className="ml-auto">
                                    Correct Answer
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.type === "TRUE_FALSE" && (
                        <div className="space-y-2">
                          <div
                            className={`flex items-center rounded-md p-2 ${
                              answer.response === "true"
                                ? question.answer === true
                                  ? "bg-green-50 dark:bg-green-950"
                                  : "bg-red-50 dark:bg-red-950"
                                : ""
                            }`}
                          >
                            {answer.response === "true" &&
                              (question.answer === true ? (
                                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="mr-2 h-5 w-5 text-red-500" />
                              ))}
                            <span>True</span>
                          </div>

                          <div
                            className={`flex items-center rounded-md p-2 ${
                              answer.response === "false"
                                ? question.answer === false
                                  ? "bg-green-50 dark:bg-green-950"
                                  : "bg-red-50 dark:bg-red-950"
                                : ""
                            }`}
                          >
                            {/* @ts-expect-error - selectedOptionIds is a string array */}
                            {answer.selectedOptionIds?.[0] === "false" &&
                              (question.answer === false ? (
                                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="mr-2 h-5 w-5 text-red-500" />
                              ))}
                            <span>False</span>
                          </div>

                          {/* Show correct answer if the selected answer is incorrect */}
                          {((answer.question.answer === true &&
                            question.answer === false) ||
                            question.answer === true) && (
                            <div className="text-muted-foreground mt-2 text-sm">
                              Correct answer:{" "}
                              {question.answer ? "True" : "False"}
                            </div>
                          )}
                        </div>
                      )}

                      {(question.type === "SHORT_ANSWER" ||
                        question.type === "LONG_ANSWER") && (
                        <div className="space-y-2">
                          <div className="bg-muted rounded-md p-3">
                            {answer.response ?? (
                              <em className="text-muted-foreground">
                                No response provided
                              </em>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm italic">
                      No answer provided
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for status badge
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "IN_PROGRESS":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
        >
          In Progress
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
        >
          Submitted
        </Badge>
      );
    case "EVALUATED":
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
        >
          Evaluated
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
