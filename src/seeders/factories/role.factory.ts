import { Role } from '@/entities/role.entity';
import { Permission } from '@/common/enums/permission.enum';
import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker/locale/vi';

export class RoleFactory extends Factory<Role> {
  model = Role;

  definition(): Partial<Role> {
    return {
      name: faker.person.jobTitle(),
      permissions: [Permission.USER_READ],
    };
  }
}
