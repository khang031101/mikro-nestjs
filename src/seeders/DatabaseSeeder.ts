import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { UserFactory } from './factories/user.factory';
import { User } from '@/entities/user.entity';

export class DatabaseSeeder extends Seeder {
  private userFactory!: UserFactory;

  async run(em: EntityManager): Promise<void> {
    this.userFactory = new UserFactory(em);

    await this.seedUsers(em);

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
    this.userFactory.make(10);
  }
}
