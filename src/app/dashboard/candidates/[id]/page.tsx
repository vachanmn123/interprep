import { api, HydrateClient } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Mail, Clock, FileText, CheckCircle2 } from "lucide-react";
import { AttemptStatus, TestType } from "@prisma/client";
import ResumeViewer from "@/components/resume-viewer";
import ResumeDataViewer from "@/components/resume-data-viewer";
import TestCreationDialog from "@/components/test-creation-wizard";
import Link from "next/link";

export default async function CandidateInfo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await api.candidate.getCandidate({ id });

  if (!candidate) {
    return <div className="p-8 text-center">Candidate not found</div>;
  }

  return (
    <HydrateClient>
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Candidate Overview</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left side - Candidate Information */}
          <Card className="h-fit">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Avatar className="h-16 w-16">
                <div className="bg-muted flex h-full w-full items-center justify-center text-xl font-semibold">
                  {candidate.name?.charAt(0) || "C"}
                </div>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{candidate.name}</CardTitle>
                <div className="mt-1">
                  <Badge variant="outline">{candidate.email}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <span>{candidate.email}</span>
                </div>
              </div>

              {/* Resume Data */}
              {candidate.resumeData && (
                <div className="mt-4">
                  <h3 className="mb-3 text-lg font-medium">Resume Data</h3>
                  <div className="h-[400px] overflow-hidden rounded-lg border">
                    <ResumeDataViewer resumeData={candidate.resumeData} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right side - Tests Overview and Resume */}
          <div className="space-y-6">
            <Tabs defaultValue="tests" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tests">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Tests
                </TabsTrigger>
                <TabsTrigger value="attempts">
                  <Clock className="mr-2 h-4 w-4" />
                  Attempts
                </TabsTrigger>
                <TabsTrigger value="resume">
                  <FileText className="mr-2 h-4 w-4" />
                  Resume
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tests" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Assigned Tests</CardTitle>
                    <TestCreationDialog candidateId={id} />
                  </CardHeader>
                  <CardContent>
                    {candidate.tests && candidate.tests.length > 0 ? (
                      <div className="space-y-4">
                        {candidate.tests.map((test) => (
                          <div key={test.id} className="rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{test.title}</h3>
                              <Badge
                                variant={
                                  test.type === TestType.TECHNICAL
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {test.type}
                              </Badge>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm"></div>
                            <div className="mt-1 text-sm">
                              <span className="text-muted-foreground">
                                Expires:{" "}
                              </span>
                              {new Date(test.expiresAt).toLocaleString()}
                            </div>
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">
                                Questions:{" "}
                              </span>
                              {test.questions?.length || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex h-40 items-center justify-center">
                        No tests assigned
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attempts" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Attempts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {candidate.testAttempts &&
                    candidate.testAttempts.length > 0 ? (
                      <div className="space-y-4">
                        {candidate.testAttempts.map((attempt) => (
                          <Link
                            href={`/dashboard/candidates/${id}/attempts/${attempt.id}`}
                            key={attempt.id}
                          >
                            <div
                              key={attempt.id}
                              className="rounded-lg border p-4"
                            >
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">
                                  {attempt.test?.title || "Unknown Test"}
                                </h3>
                                <Badge
                                  variant={
                                    attempt.status === AttemptStatus.EVALUATED
                                      ? "default"
                                      : attempt.status ===
                                          AttemptStatus.SUBMITTED
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {attempt.status}
                                </Badge>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    Started:{" "}
                                  </span>
                                  {new Date(attempt.startedAt).toLocaleString()}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Completed:{" "}
                                  </span>
                                  {attempt.completedAt
                                    ? new Date(
                                        attempt.completedAt,
                                      ).toLocaleString()
                                    : "In Progress"}
                                </div>
                              </div>
                              {attempt.status === AttemptStatus.EVALUATED && (
                                <div className="mt-2 flex items-center">
                                  <span className="text-muted-foreground mr-2 text-sm">
                                    Score:{" "}
                                  </span>
                                  <div className="flex-1">
                                    <div className="bg-muted h-2 w-full rounded-full">
                                      <div
                                        className={`h-full rounded-full ${
                                          (attempt.totalScore ?? 0) >= 80
                                            ? "bg-green-500"
                                            : (attempt.totalScore ?? 0) >= 60
                                              ? "bg-yellow-500"
                                              : "bg-red-500"
                                        }`}
                                        style={{
                                          width: `${attempt.totalScore ?? 0}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <span className="ml-2 font-medium">
                                    {attempt.totalScore ?? 0}%
                                  </span>
                                </div>
                              )}
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">
                                  Answers:{" "}
                                </span>
                                {/* {attempt.answers?.length ?? 0} */}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex h-40 items-center justify-center">
                        No test attempts yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resume" className="mt-4">
                <Card className="h-[600px] overflow-hidden">
                  <CardHeader>
                    <CardTitle>Resume Document</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)]">
                    {candidate.resumeKey ? (
                      <ResumeViewer resumeKey={candidate.resumeKey} />
                    ) : (
                      <div className="text-muted-foreground flex h-full items-center justify-center">
                        No resume document available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
