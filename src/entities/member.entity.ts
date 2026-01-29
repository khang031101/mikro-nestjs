import { Entity, ManyToOne, Property, Index } from '@mikro-orm/core';
import { TenantEntity } from '@/common/entities';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity()
@Index({ properties: ['user', 'tenantId'] })
export class Member extends TenantEntity {
  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Role)
  role!: Role;

  @Property({ default: true })
  isActive: boolean = true;

  constructor(partial: Partial<Member>) {
    super();
    Object.assign(this, partial);
  }
}
