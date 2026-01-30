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
    await this.em.nativeDelete(User, {}, { filters: false });
  }

  async createUser(
    email: string,
    password: string,
    isAdmin = false,
  ): Promise<User> {
    const user = this.userFactory.makeOne({
      email,
      password,
      isAdmin,
    });

    await this.em.flush();

    return user;
  }
}
