import { TenantEntity } from '@/common/entities';
import { Permission } from '@/common/enums/permission.enum';
import {
  Collection,
  Entity,
  OneToMany,
  Property,
  Unique,
} from '@mikro-orm/core';
import { Member } from './member.entity';

@Entity()
@Unique({ properties: ['tenantId', 'name'] })
export class Role extends TenantEntity {
  @Property()
  name!: string;

  @Property({ type: 'array' })
  permissions: Permission[] = [];

  @OneToMany(() => Member, (member) => member.role)
  members = new Collection<Member>(this);

  constructor(partial: Partial<Role>) {
    super();
    Object.assign(this, partial);
  }
}
