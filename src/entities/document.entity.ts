import { TenantEntity } from '@/common/entities';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Workspace } from './workspace.entity';

@Entity()
export class Document extends TenantEntity {
  @Property()
  title!: string;

  @Property({ type: 'jsonb' })
  snapshot!: unknown;

  @ManyToOne(() => Workspace)
  workspace!: Workspace;
}
