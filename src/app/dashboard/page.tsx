"use client";

import React from "react";
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Users, FileText, Clock, User, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: candidateStats, isLoading: loadingCandidates } =
    api.candidate.getStats.useQuery();
  const { data: testStats, isLoading: loadingTests } =
    api.test.getStats.useQuery();
  const { data: recentCandidates, isLoading: loadingRecentCandidates } =
    api.candidate.getRecent.useQuery({ limit: 5 });
  const { data: recentTests, isLoading: loadingRecentTests } =
    api.test.getRecent.useQuery({ limit: 5 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-muted-foreground text-sm">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Candidates"
          value={
            loadingCandidates
              ? undefined
              : (candidateStats?.totalCandidates ?? 0)
          }
          icon={<Users className="h-6 w-6 text-blue-500" />}
        />
        <StatsCard
          title="Active Tests"
          value={loadingTests ? undefined : (testStats?.activeTests ?? 0)}
          icon={<Activity className="h-6 w-6 text-green-500" />}
        />
        <StatsCard
          title="Completed Tests"
          value={loadingTests ? undefined : (testStats?.completedTests ?? 0)}
          icon={<FileText className="h-6 w-6 text-amber-500" />}
        />
        <StatsCard
          title="Pending Reviews"
          value={loadingTests ? undefined : (testStats?.pendingReviews ?? 0)}
          icon={<Clock className="h-6 w-6 text-red-500" />}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Candidates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Candidates</CardTitle>
            <CardDescription>Newly added candidates</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRecentCandidates ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentCandidates?.length ? (
              <div className="space-y-4">
                {recentCandidates.map((candidate) => (
                  <Link
                    href={`/dashboard/candidates/${candidate.id}`}
                    key={candidate.id}
                    className="hover:bg-muted flex items-center gap-3 rounded-lg p-2 transition-colors"
                  >
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <User className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {candidate.email}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-6 text-center">
                No candidates added yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Tests</CardTitle>
            <CardDescription>
              Recently created or completed tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRecentTests ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-52" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentTests?.length ? (
              <div className="space-y-4">
                {recentTests.map((test) => (
                  <Link
                    href={`/dashboard/candidates/${test.candidateId}`}
                    key={test.id}
                    className="hover:bg-muted flex items-center gap-3 rounded-lg p-2 transition-colors"
                  >
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Calendar className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{test.title}</p>
                        <span className={`text-xs ${getBadgeColor(test.type)}`}>
                          {test.type}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Expires{" "}
                        {formatDistanceToNow(new Date(test.expiresAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-6 text-center">
                No tests created yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
}

function StatsCard({ title, value, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {value !== undefined ? (
          <p className="text-2xl font-bold">{value}</p>
        ) : (
          <Skeleton className="h-8 w-20" />
        )}
      </CardContent>
    </Card>
  );
}

function getBadgeColor(testType: string) {
  switch (testType) {
    case "TECHNICAL":
      return "bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300";
    case "HR":
      return "bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full dark:bg-gray-800 dark:text-gray-300";
  }
}
