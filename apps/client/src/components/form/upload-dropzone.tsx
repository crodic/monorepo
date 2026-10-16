"use client";

import React from "react";
import { CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBytes } from "@/hooks/use-file-upload";

export interface UploadDropzoneProps {
  isDragging: boolean;
  disabled: boolean;
  maxSize: number;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onBrowseClick: () => void;
}

export function UploadDropzone({
  isDragging,
  disabled,
  maxSize,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onBrowseClick,
}: UploadDropzoneProps) {
  return (
    <Card
      className={cn(
        "border-muted-foreground/25 hover:border-muted-foreground/50 flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors shadow-none",
        isDragging && "border-primary bg-primary/5",
        disabled && "cursor-not-allowed opacity-60",
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <CardContent className="text-center">
        <div className="border-border mx-auto mb-3 flex size-[32px] items-center justify-center rounded-full border">
          <CloudUpload className="size-4" />
        </div>
        <h3 className="text-2sm text-foreground mb-0.5 font-semibold">
          Choose a file or drag & drop here.
        </h3>
        <span className="text-secondary-foreground mb-3 block text-xs font-normal">
          JPEG, PNG, up to {formatBytes(maxSize)}.
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onBrowseClick}
          disabled={disabled}
          type="button"
        >
          Browse File
        </Button>
      </CardContent>
    </Card>
  );
}
