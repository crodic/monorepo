import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFilesTable1771203054787 implements MigrationInterface {
  name = 'CreateFilesTable1771203054787';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "files" (
                "id" BIGSERIAL NOT NULL,
                "public_id" character varying NOT NULL,
                "folder" character varying,
                "disk" character varying,
                "visibility" character varying NOT NULL DEFAULT 'public',
                "original_name" character varying NOT NULL,
                "path" character varying NOT NULL,
                "hash" character varying NOT NULL,
                "mime" character varying NOT NULL,
                "size" integer NOT NULL,
                "width" integer,
                "height" integer,
                "duration" integer,
                "resource_type" character varying NOT NULL,
                "status" character varying NOT NULL,
                "is_starred" boolean NOT NULL DEFAULT false,
                "created_by_admin_id" bigint,
                "updated_by_admin_id" bigint,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_file_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_files_created_by_admin" FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
                CONSTRAINT "FK_files_updated_by_admin" FOREIGN KEY ("updated_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_file_public_id" ON "files" ("public_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_files_visibility" ON "files" ("visibility")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_files_folder_created_at" ON "files" ("folder", "created_at")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_files_created_by_admin_id" ON "files" ("created_by_admin_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_files_updated_by_admin_id" ON "files" ("updated_by_admin_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "files" DROP CONSTRAINT "FK_files_updated_by_admin"
        `);
    await queryRunner.query(`
            ALTER TABLE "files" DROP CONSTRAINT "FK_files_created_by_admin"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_files_updated_by_admin_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_files_created_by_admin_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_files_folder_created_at"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_files_visibility"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."UQ_file_public_id"
        `);
    await queryRunner.query(`
            DROP TABLE "files"
        `);
  }
}
