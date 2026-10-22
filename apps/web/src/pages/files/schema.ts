import z from 'zod'

const nullableString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => value ?? null)

const optionalNullableString = nullableString
  .optional()
  .transform((value) => value ?? null)

const nullableNumber = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((value) => value ?? null)

const folderNamePattern =
  /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,100}(?:\/[\p{L}\p{N}][\p{L}\p{N} ._-]{0,100})*$/u

export const folderNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(folderNamePattern)

export const fileStatusSchema = z.enum(['active', 'archived'])

export const fileResourceTypeSchema = z.enum(['image', 'video', 'raw', 'file'])

export const fileVisibilitySchema = z.enum(['public', 'private'])

export const fileSchema = z.object({
  id: z.string(),
  public_id: z.string(),
  folder: nullableString,
  disk: optionalNullableString,
  visibility: fileVisibilitySchema.default('public'),
  original_name: z.string(),
  path: z.string(),
  hash: z.string(),
  mime: z.string(),
  size: z.number(),
  width: nullableNumber,
  height: nullableNumber,
  duration: nullableNumber,
  resource_type: z.string(),
  status: z.string(),
  is_starred: z.boolean().default(false),
  url: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const folderSchema = z.object({
  folder: z.string(),
  name: z.string().optional(),
  color: z.string().optional(),
  parent: nullableString.optional(),
  depth: z.number().default(0),
  count: z.number(),
  size: z.number(),
})

export const updateFileSchema = z.object({
  folder: folderNameSchema.nullable().optional(),
  original_name: z.string().trim().min(1).max(255).optional(),
  status: fileStatusSchema.optional(),
  visibility: fileVisibilitySchema.optional(),
  disk: z.string().optional(),
  is_starred: z.boolean().optional(),
})

export const createFolderSchema = z.object({
  folder: folderNameSchema,
  color: z.string().max(20).optional(),
})

export function isValidFolderName(folder: string) {
  return folderNameSchema.safeParse(folder).success
}

export type FileSchema = z.infer<typeof fileSchema>
export type FolderSchema = z.infer<typeof folderSchema>
export type UpdateFileSchema = z.infer<typeof updateFileSchema>
export type CreateFolderSchema = z.infer<typeof createFolderSchema>
export type FileVisibility = z.infer<typeof fileVisibilitySchema>

export const ColumnKey = {
  originalName: 'original_name',
  folder: 'folder',
  visibility: 'visibility',
  resourceType: 'resource_type',
  mime: 'mime',
  status: 'status',
  size: 'size',
  dimensions: 'dimensions',
  createdAt: 'createdAt',
  actions: 'actions',
}
