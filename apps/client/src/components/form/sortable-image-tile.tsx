"use client";

import React from "react";
import { GripVertical, Star, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UIImage } from "./types";

export interface SortableImageTileProps {
  item: UIImage;
  index: number;
  isOverlay?: boolean;
  overlaySize?: { width: number; height: number } | null;
  isCover?: boolean;
  canSelectCover?: boolean;
  disabled?: boolean;
  onOpenLightbox: (index: number) => void;
  onSelectCover?: (index: number) => void;
  onRemove: (id: string) => void;
}

export function SortableImageTile({
  item,
  index,
  isOverlay = false,
  overlaySize,
  isCover = false,
  canSelectCover = false,
  disabled = false,
  onOpenLightbox,
  onSelectCover,
  onRemove,
}: SortableImageTileProps) {
  return (
    <div
      className={cn(
        "bg-accent/50 group border-border hover:bg-accent/70 relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-md border shadow-none transition-all duration-200 hover:z-10 data-[dragging=true]:z-50",
        isOverlay && "z-50 shadow-lg",
      )}
      style={
        isOverlay && overlaySize
          ? {
              width: overlaySize.width,
              height: overlaySize.height,
            }
          : undefined
      }
      onClick={isOverlay ? undefined : () => onOpenLightbox(index)}
    >
      <img
        src={item.src || "/placeholder.svg"}
        className="pointer-events-none h-full w-full rounded-md object-cover"
        alt={item.alt}
      />

      {/* Source indicator badge */}
      <span
        className={cn(
          "absolute start-2 bottom-2 rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
          item.source === "existing"
            ? "bg-background/80 text-foreground"
            : "bg-primary/80 text-primary-foreground",
        )}
      >
        {item.source === "existing" ? "Saved" : "New"}
      </span>

      <div className="bg-background/80 text-muted-foreground pointer-events-none absolute start-2 top-2 flex size-8 items-center justify-center rounded-full opacity-100 shadow-sm sm:size-6 sm:opacity-0 sm:group-hover:opacity-100">
        <GripVertical className="size-4 sm:size-3.5" />
      </div>

      {canSelectCover && !isOverlay && (
        <Button
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onSelectCover?.(index);
          }}
          variant={isCover ? "default" : "outline"}
          size="icon"
          type="button"
          disabled={disabled}
          aria-label={isCover ? "Current cover image" : "Set as cover image"}
          className={cn(
            "absolute end-2 top-2 size-8 rounded-full shadow-sm sm:size-6",
            !isCover &&
              "bg-background/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
          )}
        >
          <Star
            className={cn("size-4 sm:size-3.5", isCover && "fill-current")}
          />
        </Button>
      )}

      {/* Remove Button */}
      {!disabled && !isOverlay && (
        <Button
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove(item.id);
          }}
          variant="outline"
          size="icon"
          type="button"
          className={cn(
            "bg-background/80 absolute size-8 rounded-full opacity-100 shadow-sm sm:size-6 sm:opacity-0 sm:group-hover:opacity-100",
            canSelectCover ? "end-2 bottom-2" : "end-2 top-2",
          )}
        >
          <XIcon className="size-4 sm:size-3.5" />
        </Button>
      )}
    </div>
  );
}
