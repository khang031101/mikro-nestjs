import { User } from '@/entities/user.entity';
import { Factory } from '@mikro-orm/seeder';
import { faker } from '@faker-js/faker/locale/vi';

export class UserFactory extends Factory<User> {
  model = User;

  definition(): Partial<User> {
    const sex = faker.person.sexType();
    const lastName = faker.person.lastName(sex);
    const firstName = faker.person.firstName();
    return {
      name: faker.person.fullName({ firstName, lastName, sex }),
      email: faker.internet
        .email({
          lastName,
          firstName,
          provider: 'demo.com',
        })
        .toLocaleLowerCase(),
      password: 'Password123!',
    };
  }
}
