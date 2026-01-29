import { Member } from '@/entities/member.entity';
import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker/locale/vi';

export class MemberFactory extends Factory<Member> {
  model = Member;

  definition(): Partial<Member> {
    return {
      isActive: true,
      tenantId: faker.string.uuid(),
    };
  }
}
