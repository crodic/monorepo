"use client";

import React from "react";
import { CircleX, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/hooks/use-file-upload";
import type { UploadProgress } from "./types";

export interface UploadProgressListProps {
  entries: UploadProgress[];
  onRemove: (tempId: string) => void;
  disabled?: boolean;
}

export function UploadProgressList({
  entries,
  onRemove,
  disabled = false,
}: UploadProgressListProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      {entries.map((item) => (
        <Card key={item.tempId} className="rounded-md shadow-none">
          <CardContent className="flex items-center gap-2 p-3">
            <div className="border-border flex size-[32px] shrink-0 items-center justify-center rounded-md border">
              <ImageIcon className="text-muted-foreground size-4" />
            </div>
            <div className="flex w-full flex-col gap-1.5">
              <div className="-mt-2 flex w-full items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-foreground text-xs leading-none font-medium">
                    {item.fileName}
                  </span>
                  <span className="text-muted-foreground text-xs leading-none font-normal">
                    {formatBytes(item.fileSize)}
                  </span>
                  {item.status === "uploading" && (
                    <p className="text-muted-foreground text-xs">
                      Uploading... {Math.round(item.progress)}%
                    </p>
                  )}
                  {item.status === "completed" && (
                    <p className="text-xs text-green-600">Completed</p>
                  )}
                </div>
                <Button
                  onClick={() => onRemove(item.tempId)}
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={disabled}
                >
                  <CircleX className="size-3.5" />
                </Button>
              </div>

              <Progress
                value={item.progress}
                className={cn(
                  "h-1 transition-all duration-300",
                  "[&>div]:bg-zinc-950 dark:[&>div]:bg-zinc-50",
                )}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
