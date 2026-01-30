import { Member } from '@/entities/member.entity';
import { MemberFactory } from '@/seeders/factories/member.factory';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '@/entities/user.entity';
import { Role } from '@/entities/role.entity';

export class MemberHelper {
  private em: EntityManager;
  private memberFactory: MemberFactory;

  constructor() {
    this.em = global.testContext.app.get(EntityManager).fork();
    this.memberFactory = new MemberFactory(this.em);
  }

  async clearMembers() {
    await this.em.nativeDelete(Member, {}, { filters: false });
  }

  async createMember(
    user: User | string,
    role: Role | string,
    tenantId: string,
  ): Promise<Member> {
    // Use a fresh fork to avoid tenant filter issues
    const freshEm = this.em.fork();

    const member = this.memberFactory.makeOne({
      tenantId,
      isActive: true,
    });

    // Handle user as ID or object
    if (typeof user === 'string') {
      const userEntity = await freshEm.findOneOrFail(User, { id: user });
      member.user = userEntity;
    } else {
      member.user = user;
    }

    // Handle role as ID or object - fetch directly by ID without tenant filter
    if (typeof role === 'string') {
      // Fetch role using raw query to bypass tenant filter
      const roleEntity = await freshEm.getRepository(Role).findOneOrFail(role);
      member.role = roleEntity;
    } else {
      member.role = role;
    }

    await freshEm.persist(member).flush();

    return member;
  }
}
