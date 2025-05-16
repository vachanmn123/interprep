"use client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface CameraPreviewToggleProps {
  onToggle: (isVisible: boolean) => void;
  isVisible: boolean;
}

export default function CameraPreviewToggle({
  onToggle,
  isVisible,
}: CameraPreviewToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => onToggle(!isVisible)}
      title={isVisible ? "Hide camera preview" : "Show camera preview"}
    >
      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </Button>
  );
}
