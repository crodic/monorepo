import React from "react";

export interface CoverProgressOverlayProps {
  isUploading: boolean;
  isCropping: boolean;
  uploadProgress: number;
}

export function CoverProgressOverlay({
  isUploading,
  isCropping,
  uploadProgress,
}: CoverProgressOverlayProps) {
  if (!isUploading && !isCropping) {
    return null;
  }

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - uploadProgress / 100);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
      <div className="relative">
        <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-white/20"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${strokeDashoffset}`}
            className="text-white transition-all duration-300"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-white select-none">
            {isCropping ? "Crop" : `${Math.round(uploadProgress)}%`}
          </span>
        </div>
      </div>
    </div>
  );
}
