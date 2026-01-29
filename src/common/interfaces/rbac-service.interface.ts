export interface IRbacService {
  getUserPermissions(userId: string, tenantId?: string): Promise<string[]>;
}
