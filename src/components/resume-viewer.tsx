"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getFile } from "@/actions/getFile";
import { Loader2 } from "lucide-react";

export default function ResumeViewer({ resumeKey }: { resumeKey: string }) {
  const {
    data: resumeUrl,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["resume", resumeKey],
    queryFn: () => getFile(resumeKey),
    enabled: !!resumeKey,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin" />
        Loading Resume...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>
          Error loading resume: <pre>{error.message}</pre>
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <iframe
        src={resumeUrl}
        className="h-full w-full"
        title="Resume Viewer"
        frameBorder="0"
        allowFullScreen
      ></iframe>
    </div>
  );
}
