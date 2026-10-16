export type CoverPosition = {
  x: number;
  y: number;
};

export const DEFAULT_POSITION: CoverPosition = { x: 50, y: 50 };
export const COVER_ASPECT_RATIO = 21 / 9;
export const OUTPUT_WIDTH = 1200;
export const OUTPUT_HEIGHT = Math.round(OUTPUT_WIDTH / COVER_ASPECT_RATIO);

export function clampPosition(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function normalizePosition(
  position: Partial<CoverPosition>,
): CoverPosition {
  return {
    x: clampPosition(position.x ?? DEFAULT_POSITION.x),
    y: clampPosition(position.y ?? DEFAULT_POSITION.y),
  };
}

export function createObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image"));
    image.src = url;
  });
}

export async function cropCoverFile(
  file: File,
  position: CoverPosition,
): Promise<File> {
  const url = createObjectUrl(file);

  try {
    const image = await loadImage(url);
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const sourceAspectRatio = sourceWidth / sourceHeight;

    let cropX = 0;
    let cropY = 0;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;

    if (sourceAspectRatio > COVER_ASPECT_RATIO) {
      cropWidth = sourceHeight * COVER_ASPECT_RATIO;
    } else if (sourceAspectRatio < COVER_ASPECT_RATIO) {
      cropHeight = sourceWidth / COVER_ASPECT_RATIO;
    }

    cropX = (sourceWidth - cropWidth) * (position.x / 100);
    cropY = (sourceHeight - cropHeight) * (position.y / 100);

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is not supported");
    }

    context.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      OUTPUT_WIDTH,
      OUTPUT_HEIGHT,
    );

    const mimeType = file.type || "image/jpeg";
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (nextBlob) => {
          if (nextBlob) {
            resolve(nextBlob);
          } else {
            reject(new Error("Could not crop image"));
          }
        },
        mimeType,
        0.92,
      );
    });

    const extension = mimeType.split("/")[1] || "jpg";
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const croppedFileName = `${baseName}-cover.${extension}`;

    return new File([blob], croppedFileName, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
