import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFileUploadSessionsTable1780192560000 implements MigrationInterface {
  name = 'CreateFileUploadSessionsTable1780192560000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "file_upload_sessions" (
        "id" character varying(64) NOT NULL,
        "original_name" character varying(255) NOT NULL,
        "mime" character varying(150) NOT NULL,
        "size" bigint NOT NULL,
        "total_chunks" integer NOT NULL,
        "chunk_size" integer NOT NULL,
        "uploaded_chunks" jsonb NOT NULL DEFAULT '[]',
        "disk" character varying(50) NOT NULL DEFAULT 'public',
        "visibility" character varying(20) NOT NULL DEFAULT 'public',
        "folder" character varying(255),
        "s3_upload_id" character varying(255),
        "s3_key" character varying(500),
        "s3_parts" jsonb,
        "image_width" integer,
        "image_height" integer,
        "status" character varying(30) NOT NULL DEFAULT 'pending',
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_file_upload_sessions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_file_upload_sessions_status" ON "file_upload_sessions" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_file_upload_sessions_expires_at" ON "file_upload_sessions" ("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_file_upload_sessions_expires_at"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_file_upload_sessions_status"
    `);
    await queryRunner.query(`
      DROP TABLE "file_upload_sessions"
    `);
  }
}
