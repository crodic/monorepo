import { AutoIncrementID } from '../../../common/types/common.type';
import { AbstractEntity } from '../../../database/entities/abstract.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { FileEntity } from './file.entity';

@Entity('file_folders')
export class FileFolderEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_file_folder_id',
    type: 'bigint',
  })
  id!: AutoIncrementID;

  @Column({ type: 'varchar', length: 255 })
  @Index('UQ_file_folder_name', { unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string | null;

  @Column({ name: 'parent_id', type: 'bigint', nullable: true })
  @Index('IDX_file_folders_parent_id')
  parentId?: AutoIncrementID | null;

  @Column({ type: 'integer', default: 0 })
  depth: number;

  @ManyToOne(() => FileFolderEntity, (folder) => folder.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'parent_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_file_folders_parent_id',
  })
  parent?: Relation<FileFolderEntity> | null;

  @OneToMany(() => FileFolderEntity, (folder) => folder.parent)
  children?: Relation<FileFolderEntity[]>;

  @OneToMany(() => FileEntity, (file) => file.folderRelation)
  files?: Relation<FileEntity[]>;
}
