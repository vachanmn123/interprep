"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, FileText, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { uploadFile } from "@/actions/uploadFile";
import ResumeViewer from "@/components/resume-viewer";
import Link from "next/link";

export default function CandidatesPage() {
  const { data: candidates, isLoading } = api.candidate.getAll.useQuery();
  const {
    mutate: addCandidate,
    isPending: addingCandidate,
    error: addCandidateError,
  } = api.candidate.addCandidate.useMutation();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [fileUploading, setFileUploading] = useState(false);

  const [viewingResume, setViewingResume] = useState(false);
  const [resumeKey, setResumeKey] = useState<string | null>(null);

  // This is a placeholder for the user to implement
  const formSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileUploading(true);
    let fileKey: string | null = null;
    try {
      fileKey = await uploadFile(file!);
      if (!fileKey) {
        throw new Error("File upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setFileUploading(false);
      return;
    } finally {
      setFileUploading(false);
    }

    addCandidate({
      name,
      email,
      fileKey,
    });
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setFile(null);
    setFileError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type === "application/pdf" ||
        selectedFile.type === "application/msword" ||
        selectedFile.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setFile(selectedFile);
        setFileError("");
      } else {
        setFile(null);
        setFileError("Please upload a PDF or Word document");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="mt-2 text-gray-500">Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Candidates</h1>
        <Dialog
          open={open}
          onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Candidate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={formSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Candidate</DialogTitle>
                {addCandidateError && (
                  <p className="mt-1 text-sm text-red-500">
                    {addCandidateError.message}
                  </p>
                )}
                <DialogDescription>
                  Enter the candidate details and upload their resume.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="resume" className="text-right">
                    Resume
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="resume"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      required
                    />
                    {fileError && (
                      <p className="mt-1 text-sm text-red-500">{fileError}</p>
                    )}
                    {file && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <FileText className="mr-1 h-4 w-4" />
                        {file.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={addingCandidate || fileUploading}
                  className="flex items-center"
                >
                  {(addingCandidate || fileUploading) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Candidate
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-6 text-center"
                >
                  No candidates found. Add your first candidate.
                </TableCell>
              </TableRow>
            ) : (
              candidates?.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell className="font-medium">
                    {candidate.name}
                  </TableCell>
                  <TableCell>{candidate.email}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setResumeKey(candidate.resumeKey);
                        setViewingResume(true);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View Resume</span>
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/candidates/${candidate.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Dialog
          open={viewingResume}
          onOpenChange={(newOpen) => {
            setViewingResume(newOpen);
            if (!newOpen) setResumeKey(null);
          }}
        >
          <DialogContent className="min-h-[75vh]">
            <ResumeViewer resumeKey={resumeKey!} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
