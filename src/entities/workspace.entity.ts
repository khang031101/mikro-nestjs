import { CoreEntity } from '@/common/entities';
import { Collection, Entity, OneToMany, Property } from '@mikro-orm/core';
import { WorkspaceMember } from './workspace-member.entity';

@Entity()
export class Workspace extends CoreEntity {
  @Property()
  name!: string;

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  users = new Collection<WorkspaceMember>(this);
}
