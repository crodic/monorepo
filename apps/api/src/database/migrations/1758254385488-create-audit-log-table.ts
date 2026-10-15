import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogTable1758254385488 implements MigrationInterface {
  name = 'CreateAuditLogTable1758254385488';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "activity_logs" (
        "id" BIGSERIAL NOT NULL,
        "log_name" character varying NOT NULL DEFAULT 'default',
        "description" text,
        "subject_type" character varying,
        "subject_id" bigint,
        "causer_type" character varying,
        "causer_id" character varying,
        "properties" json,
        "event" character varying,
        "batch_uuid" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_log_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activity_logs_log_name" ON "activity_logs" ("log_name")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activity_logs_subject_type" ON "activity_logs" ("subject_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activity_logs_subject_id" ON "activity_logs" ("subject_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activity_logs_causer_type" ON "activity_logs" ("causer_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activity_logs_causer_id" ON "activity_logs" ("causer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activity_logs_event" ON "activity_logs" ("event")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activity_logs_batch_uuid" ON "activity_logs" ("batch_uuid")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_activity_logs_batch_uuid"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_activity_logs_event"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_activity_logs_causer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_activity_logs_causer_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_activity_logs_subject_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_activity_logs_subject_type"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_activity_logs_log_name"`);
    await queryRunner.query(`DROP TABLE "activity_logs"`);
  }
}
