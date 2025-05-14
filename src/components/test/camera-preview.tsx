"use client";

import { useEffect, useRef } from "react";

interface CameraPreviewProps {
  stream: MediaStream;
}

export default function CameraPreview({ stream }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

    return () => {
      // No need to stop tracks here as we'll handle that in the parent component
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="h-full w-full object-cover"
    />
  );
}
