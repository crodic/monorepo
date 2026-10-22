import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileIsStarredAndFolderColor1792633704307 implements MigrationInterface {
  name = 'AddFileIsStarredAndFolderColor1792633704307';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file_folders" ADD "color" character varying(20) NOT NULL DEFAULT '#8B5CF6'`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD "is_starred" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "is_starred"`);
    await queryRunner.query(`ALTER TABLE "file_folders" DROP COLUMN "color"`);
  }
}
