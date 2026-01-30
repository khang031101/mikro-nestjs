import { ClsServiceManager } from 'nestjs-cls';

export const getTenantId = (): string => {
  const cls = ClsServiceManager.getClsService();
  const tenantId = cls.get<string>('tenantId') ?? '';
  return tenantId;
};
