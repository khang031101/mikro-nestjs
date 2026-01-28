import { Card } from '@/modules/cards/entities/card.entity';
import { faker } from '@faker-js/faker/locale/vi';
import { Factory } from '@mikro-orm/seeder';

export class CardFactory extends Factory<Card> {
  model = Card;

  definition(): Partial<Card> {
    return {
      slug: faker.lorem.slug(3),
      displayName: faker.person.fullName(),
      jobTitle: faker.person.jobTitle(),
      email: faker.internet.email(),
      bankName: faker.finance.accountName(),
      bankAccountName: faker.finance.accountName(),
      bankAccountNumber: faker.finance.accountNumber(),
      bio: faker.lorem.paragraph(),
      coverUrl: faker.image.url(),
      avatarUrl: faker.image.avatar(),
      company: faker.company.name(),
    };
  }
}
