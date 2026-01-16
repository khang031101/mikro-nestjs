import { TenantEntity } from '@/common/entities';
import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { Workspace } from './workspace.entity';
import { User } from './user.entity';

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

@Entity()
export class WorkspaceMember extends TenantEntity {
  @ManyToOne(() => Workspace)
  workspace!: Workspace;

  @ManyToOne(() => User)
  user!: User;

  @Enum(() => WorkspaceRole)
  role: WorkspaceRole = WorkspaceRole.MEMBER;

  @Property({ default: true })
  isActive = true;
}
