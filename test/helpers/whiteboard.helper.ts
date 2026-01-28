import { EntityManager } from '@mikro-orm/postgresql';
import { Whiteboard } from '@/modules/whiteboards/entities/whiteboard.entity';

export class WhiteboardHelper {
  private em: EntityManager;

  constructor() {
    this.em = global.testContext.app.get(EntityManager).fork();
  }

  async setContent(id: string, content: string) {
    const whiteboard = await this.em.findOneOrFail(Whiteboard, { id });
    whiteboard.content = Buffer.from(content);
    await this.em.flush();
  }

  async clearWhiteboards() {
    await this.em
      .getConnection()
      .execute('TRUNCATE TABLE "whiteboard" RESTART IDENTITY CASCADE');
    await this.em
      .getConnection()
      .execute('TRUNCATE TABLE "whiteboard_version" RESTART IDENTITY CASCADE');
  }
}
