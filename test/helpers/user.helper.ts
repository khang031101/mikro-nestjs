import { User } from '@/entities/user.entity';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';

export class UserHelper {
  private em: EntityManager;
  private userRepository: EntityRepository<User>;

  constructor() {
    this.em = global.testContext.app.get(EntityManager).fork();
    this.userRepository = this.em.getRepository(User);
  }

  async clearUsers() {
    await this.em
      .getConnection()
      .execute(
        'TRUNCATE TABLE "document_version", "document", "workspace_member", "workspace", "user" RESTART IDENTITY CASCADE',
      );
  }

  async createUser(email: string, password: string): Promise<User> {
    const user = new User({});
    user.email = email;
    user.password = password;

    this.userRepository.create(user);

    await this.em.flush();

    return user;
  }
}
