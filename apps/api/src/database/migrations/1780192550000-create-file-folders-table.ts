import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFileFoldersTable1780192550000 implements MigrationInterface {
  name = 'CreateFileFoldersTable1780192550000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "file_folders" (
        "id" BIGSERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "title" character varying(255),
        "color" character varying(20) NOT NULL DEFAULT '#8B5CF6',
        "parent_id" bigint,
        "depth" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_file_folder_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_file_folders_parent_id" FOREIGN KEY ("parent_id") REFERENCES "file_folders"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_file_folder_name" ON "file_folders" ("name")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_file_folders_parent_id" ON "file_folders" ("parent_id")
    `);

    await queryRunner.query(`
      INSERT INTO "file_folders" ("name", "title", "depth")
      SELECT DISTINCT "folder", "folder", 0 FROM "files"
      WHERE "folder" IS NOT NULL AND "folder" <> ''
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      ALTER TABLE "files"
      ADD CONSTRAINT "FK_files_folder_name"
      FOREIGN KEY ("folder") REFERENCES "file_folders"("name")
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "files" DROP CONSTRAINT "FK_files_folder_name"
    `);
    await queryRunner.query(`
      ALTER TABLE "file_folders" DROP CONSTRAINT "FK_file_folders_parent_id"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_file_folders_parent_id"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."UQ_file_folder_name"
    `);
    await queryRunner.query(`
      DROP TABLE "file_folders"
    `);
  }
}
