export type ImageFormat = 'jpeg' | 'png' | 'webp';

export interface ImageSizeOption extends Omit<ImageTransformOptions, 'width'> {
  name: string;
  width: number;
  height?: number;
}

export interface ImageTransformOptions {
  width?: number | null;
  height?: number | null;
  rotate?: number | null;
  crop?:
    | 'fill'
    | 'cover'
    | 'fit'
    | 'crop'
    | 'limit'
    | 'pad'
    | 'lfill'
    | 'thumb'
    | { x: number; y: number; width: number; height: number }
    | null;
  gravity?: string | null;
  format?: string | null;
  quality?: number | null;
  aspectRatio?: string | null;
  effect?: { type: string; value: string | number | null } | null;
  flip?: 'horizontal' | 'vertical' | null;
  autoOrient?: boolean;
  background?: string | null;
  overlay?: string | null;
}

export interface UploadImageOptions {
  folder?: string;
  format?: ImageFormat;
  quality?: number;
  compress?: boolean;
  sizes?: ImageSizeOption[];
  generateThumbnail?: boolean;
  thumbnailWidth?: number;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  transform?: ImageTransformOptions;
}

export interface ImageTransformData {
  fieldname: string;
  originalname: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;

  width?: number;
  height?: number;
  format?: string;
}

export interface UploadFileOptions {
  folder?: string;
  rename?: boolean;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
}

export interface UploadVideoOptions {
  folder?: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  transform?: VideoTransformOptions;
}

export interface VideoTransformOptions {
  width?: number | null;
  height?: number | null;
  start?: number | null;
  duration?: number | null;
  fps?: number | null;
  bitrate?: number | null;
  format?: string | null;
  flip?: 'horizontal' | 'vertical' | null;
  rotate?: number | null;
}
