import { AutoIncrementID } from '../../../common/types/common.type';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { AdminUserEntity } from '../../admin-user/entities/admin-user.entity';
import { FileFolderEntity } from './file-folder.entity';

@Index('IDX_files_folder_created_at', ['folder', 'createdAt'])
@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_file_id',
    type: 'bigint',
  })
  id!: AutoIncrementID;

  @Column()
  @Index('UQ_file_public_id', { unique: true })
  public_id!: string;

  @Column({ type: 'varchar', nullable: true })
  folder: string | null;

  @ManyToOne(() => FileFolderEntity, (folder) => folder.files, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'folder',
    referencedColumnName: 'name',
    foreignKeyConstraintName: 'FK_files_folder_name',
  })
  folderRelation?: Relation<FileFolderEntity>;

  @Column({ type: 'varchar', nullable: true })
  disk: string | null;

  @Column({ type: 'varchar', default: 'public' })
  @Index('IDX_files_visibility')
  visibility: 'public' | 'private';

  @Column()
  original_name: string;

  @Column()
  path: string;

  @Column()
  hash: string;

  @Column()
  mime: string;

  @Column()
  size: number;

  @Column({ type: 'integer', nullable: true })
  width: number | null;

  @Column({ type: 'integer', nullable: true })
  height: number | null;

  @Column({ type: 'integer', nullable: true })
  duration: number | null;

  @Column()
  resource_type: string;

  @Column()
  status: string;

  @Column({ type: 'boolean', default: false })
  is_starred: boolean;

  @Index('IDX_files_created_by_admin_id')
  @Column({ name: 'created_by_admin_id', type: 'bigint', nullable: true })
  createdByAdminId?: AutoIncrementID | null;

  @ManyToOne(() => AdminUserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'created_by_admin_id',
    foreignKeyConstraintName: 'FK_files_created_by_admin',
  })
  createdByAdmin?: Relation<AdminUserEntity> | null;

  @Index('IDX_files_updated_by_admin_id')
  @Column({ name: 'updated_by_admin_id', type: 'bigint', nullable: true })
  updatedByAdminId?: AutoIncrementID | null;

  @ManyToOne(() => AdminUserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'updated_by_admin_id',
    foreignKeyConstraintName: 'FK_files_updated_by_admin',
  })
  updatedByAdmin?: Relation<AdminUserEntity> | null;

  get url() {
    const ext = this.path.split('.').pop();
    return `${process.env.APP_URL}/storage/uploads/${this.resource_type}/${this.public_id}.${ext}`;
  }

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    default: null,
    nullable: true,
  })
  deletedAt?: Date | null;
}
