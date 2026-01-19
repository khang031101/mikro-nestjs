import { Filter, Property } from '@mikro-orm/core';
import { ClsServiceManager } from 'nestjs-cls';
import { CoreEntity } from './core.entity';

@Filter({
  name: 'tenant',
  cond: () => {
    const cls = ClsServiceManager.getClsService();
    const tenantId = cls.get<string>('tenantId') ?? '';
    return { tenantId };
  },
  default: true,
})
export abstract class TenantEntity extends CoreEntity {
  @Property({ type: 'uuid' })
  tenantId!: string;
}
