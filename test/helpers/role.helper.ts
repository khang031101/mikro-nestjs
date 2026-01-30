import { Permission } from '@/common/enums/permission.enum';
import { Role } from '@/entities/role.entity';
import { RoleFactory } from '@/seeders/factories/role.factory';
import { EntityManager } from '@mikro-orm/postgresql';

export class RoleHelper {
  private em: EntityManager;
  private roleFactory: RoleFactory;

  constructor() {
    this.em = global.testContext.app.get(EntityManager).fork();
    this.roleFactory = new RoleFactory(this.em);
  }

  async clearRoles() {
    await this.em.nativeDelete(Role, {}, { filters: false });
  }

  async createRole(
    name: string,
    permissions: Permission[],
    tenantId: string,
  ): Promise<Role> {
    const role = this.roleFactory.makeOne({
      name,
      permissions,
      tenantId,
    });

    await this.em.flush();

    return role;
  }

  async findRole(id: string) {
    return this.em.findOneOrFail(
      Role,
      { id },
      { filters: false, refresh: true },
    );
  }
}
