import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('file_upload_sessions')
export class FileUploadSessionEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 150 })
  mime!: string;

  @Column({ type: 'bigint' })
  size!: number;

  @Column({ name: 'total_chunks', type: 'integer' })
  totalChunks!: number;

  @Column({ name: 'chunk_size', type: 'integer' })
  chunkSize!: number;

  @Column({ name: 'uploaded_chunks', type: 'jsonb', default: () => "'[]'" })
  uploadedChunks!: number[];

  @Column({ type: 'varchar', length: 50, default: 'public' })
  disk!: string;

  @Column({ type: 'varchar', length: 20, default: 'public' })
  visibility!: 'public' | 'private';

  @Column({ type: 'varchar', length: 255, nullable: true })
  folder?: string | null;

  @Column({
    name: 's3_upload_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  s3UploadId?: string | null;

  @Column({ name: 's3_key', type: 'varchar', length: 500, nullable: true })
  s3Key?: string | null;

  @Column({ name: 's3_parts', type: 'jsonb', nullable: true })
  s3Parts?: Array<{ partNumber: number; etag: string }> | null;

  @Column({ name: 'image_width', type: 'integer', nullable: true })
  imageWidth?: number | null;

  @Column({ name: 'image_height', type: 'integer', nullable: true })
  imageHeight?: number | null;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  @Index('IDX_file_upload_sessions_status')
  status!: 'pending' | 'completed' | 'aborted' | 'expired';

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
    nullable: false,
  })
  @Index('IDX_file_upload_sessions_expires_at')
  expiresAt!: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
