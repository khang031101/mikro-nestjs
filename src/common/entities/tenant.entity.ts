import { Filter, Property } from '@mikro-orm/core';
import { getTenantId } from '../utils/tenant';
import { CoreEntity } from './core.entity';

@Filter({
  name: 'tenant',
  cond: () => {
    return { tenantId: getTenantId() };
  },
  default: true,
})
export abstract class TenantEntity extends CoreEntity {
  @Property({ type: 'uuid' })
  tenantId!: string;
}
