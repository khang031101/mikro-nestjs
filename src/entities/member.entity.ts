import { TenantEntity } from '@/common/entities';
import { getTenantId } from '@/common/utils/tenant';
import {
  BeforeCreate,
  Entity,
  Index,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity()
@Index({ properties: ['user', 'tenantId'] })
export class Member extends TenantEntity {
  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @ManyToOne(() => Role, { deleteRule: 'cascade' })
  role!: Role;

  @Property({ default: true })
  isActive: boolean = true;

  constructor(partial: Partial<Member>) {
    super();
    Object.assign(this, partial);
  }

  @BeforeCreate()
  setTenantId() {
    if (this.tenantId) {
      return;
    }

    this.tenantId = getTenantId();
  }
}
