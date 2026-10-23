"use client";

import React, { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UIImage } from "./types";

export interface ImageLightboxProps {
  images: UIImage[];
  currentIndex: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

function resolveSafeLightboxIndex(
  currentIndex: number | null,
  images: UIImage[]
): number | null {
  if (currentIndex === null || images.length === 0) return null;
  if (images[currentIndex]) return currentIndex;
  return Math.min(currentIndex, images.length - 1);
}

export function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const safeIndex = resolveSafeLightboxIndex(currentIndex, images);

  const currentImage = safeIndex !== null ? images[safeIndex] : null;

  const showPrevious = useCallback(() => {
    if (safeIndex === null || images.length === 0) return;
    onIndexChange((safeIndex - 1 + images.length) % images.length);
  }, [safeIndex, images.length, onIndexChange]);

  const showNext = useCallback(() => {
    if (safeIndex === null || images.length === 0) return;
    onIndexChange((safeIndex + 1) % images.length);
  }, [safeIndex, images.length, onIndexChange]);

  useEffect(() => {
    if (safeIndex === null || images.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        showPrevious();
      } else if (event.key === "ArrowRight") {
        showNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [safeIndex, images.length, onClose, showPrevious, showNext]);

  if (!currentImage || safeIndex === null) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute end-4 top-4 z-10 size-10 rounded-full text-white hover:bg-white/15 hover:text-white"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label="Close image preview"
      >
        <XIcon className="size-5" />
      </Button>

      {images.length > 1 && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute start-4 top-1/2 z-10 size-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white sm:start-6 sm:size-14"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            aria-label="Previous image"
          >
            <ChevronLeft className="size-7" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-4 top-1/2 z-10 size-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white sm:end-6 sm:size-14"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            aria-label="Next image"
          >
            <ChevronRight className="size-7" />
          </Button>
        </>
      )}

      <div
        className="flex size-full items-center justify-center px-4 py-16 sm:px-20 sm:py-10"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={currentImage.src || "/placeholder.svg"}
          alt={currentImage.alt}
          className="max-h-full max-w-full object-contain shadow-2xl"
        />
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white">
        {safeIndex + 1}/{images.length}
      </div>
    </div>
  );
}
