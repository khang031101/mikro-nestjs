import { Permission } from '@/common/enums/permission.enum';
import { Member } from '@/entities/member.entity';
import { Role } from '@/entities/role.entity';
import { User } from '@/entities/user.entity';
import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { MemberFactory } from './factories/member.factory';
import { RoleFactory } from './factories/role.factory';
import { UserFactory } from './factories/user.factory';

const USER_COUNT = 20;

export class DatabaseSeeder extends Seeder {
  private userFactory!: UserFactory;
  private roleFactory!: RoleFactory;
  private memberFactory!: MemberFactory;
  // Use a fixed UUID for the demo tenant so roles don't conflict on re-runs
  private demoTenantId = '00000000-0000-0000-0000-000000000001';

  async run(em: EntityManager): Promise<void> {
    this.userFactory = new UserFactory(em);
    this.roleFactory = new RoleFactory(em);
    this.memberFactory = new MemberFactory(em);

    await this.seedUsers(em);
    const roles = await this.seedRoles(em);
    await this.seedMembers(em, roles);

    await em.flush();
  }

  private async seedUsers(em: EntityManager) {
    const admin = await em.findOne(User, { email: 'admin@demo.com' });
    if (!admin) {
      this.userFactory.makeOne({
        name: 'Admin',
        email: 'admin@demo.com',
        password: 'Password123!',
        isAdmin: true,
      });
    }

    const regularUsers = await em.count(User, { isAdmin: false });
    if (regularUsers < USER_COUNT) {
      this.userFactory.make(USER_COUNT - regularUsers);
    }
  }

  private async seedRoles(em: EntityManager): Promise<Role[]> {
    const roles: Role[] = [];

    // Admin role - use qb to bypass tenant filter
    const adminRoleResult = await em.find(
      Role,
      {
        name: 'Admin',
        tenantId: this.demoTenantId,
      },
      { filters: false },
    );

    let adminRole = adminRoleResult[0];
    if (!adminRole) {
      adminRole = this.roleFactory.makeOne({
        name: 'Admin',
        tenantId: this.demoTenantId,
        permissions: [Permission.ADMIN],
      });
    }
    roles.push(adminRole);

    // Editor role - use qb to bypass tenant filter
    const editorRoleResult = await em.find(
      Role,
      {
        name: 'Editor',
        tenantId: this.demoTenantId,
      },
      { filters: false },
    );

    let editorRole = editorRoleResult[0];
    if (!editorRole) {
      editorRole = this.roleFactory.makeOne({
        name: 'Editor',
        tenantId: this.demoTenantId,
        permissions: [Permission.USER_READ, Permission.USER_WRITE],
      });
    }
    roles.push(editorRole);

    // Viewer role - use qb to bypass tenant filter
    const viewerRoleResult = await em.find(
      Role,
      {
        name: 'Viewer',
        tenantId: this.demoTenantId,
      },
      {
        filters: false,
      },
    );

    let viewerRole = viewerRoleResult[0];
    if (!viewerRole) {
      viewerRole = this.roleFactory.makeOne({
        name: 'Viewer',
        tenantId: this.demoTenantId,
        permissions: [Permission.USER_READ],
      });
    }
    roles.push(viewerRole);

    return [adminRole, editorRole, viewerRole];
  }

  private async seedMembers(em: EntityManager, roles: Role[]) {
    const users = await em.find(
      User,
      { isAdmin: false },
      { limit: USER_COUNT },
    );
    const [adminRole, editorRole, viewerRole] = roles;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      // Check if member already exists using qb to bypass tenant filter
      const existingMemberResult = await em.find(
        Member,
        {
          user: user.id,
          tenantId: this.demoTenantId,
        },
        { filters: false },
      );

      const existingMember = existingMemberResult[0];

      if (!existingMember) {
        // Assign roles: first 2 users as admins, next 4 as editors, rest as viewers
        let role: Role;
        if (i < 2) {
          role = adminRole;
        } else if (i < 6) {
          role = editorRole;
        } else {
          role = viewerRole;
        }

        const member = this.memberFactory.makeOne({
          tenantId: this.demoTenantId,
          isActive: true,
        });
        member.user = user;
        member.role = role;
      }
    }
  }
}
