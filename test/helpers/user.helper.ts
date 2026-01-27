import { User } from '@/entities/user.entity';
import { UserFactory } from '@/seeders/factories/user.factory';
import { EntityManager } from '@mikro-orm/postgresql';

export class UserHelper {
  private em: EntityManager;
  private userFactory: UserFactory;

  constructor() {
    this.em = global.testContext.app.get(EntityManager).fork();
    this.userFactory = new UserFactory(this.em);
  }

  async clearUsers() {
    await this.em
      .getConnection()
      .execute('TRUNCATE TABLE "user" RESTART IDENTITY CASCADE');
  }

  async createUser(email: string, password: string): Promise<User> {
    const user = this.userFactory.makeOne({
      email,
      password,
    });

    await this.em.flush();

    return user;
  }
}
