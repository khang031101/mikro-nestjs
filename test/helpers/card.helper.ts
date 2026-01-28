import { User } from '@/entities/user.entity';
import { Card } from '@/modules/cards/entities/card.entity';
import { CardFactory } from '@/seeders/factories/card.factory';
import { EntityManager } from '@mikro-orm/postgresql';

export class CardHelper {
  private em: EntityManager;
  private cardFactory: CardFactory;

  constructor() {
    this.em = global.testContext.app.get(EntityManager).fork();
    this.cardFactory = new CardFactory(this.em);
  }

  async createCard(
    userId: string,
    override: Partial<Card> = {},
  ): Promise<Card> {
    const card = this.cardFactory.makeOne(override);

    card.user = this.em.getReference(User, userId);

    this.em.persist(card);
    await this.em.flush();

    return card;
  }

  async clearCards() {
    await this.em
      .getConnection()
      .execute('TRUNCATE TABLE "card" RESTART IDENTITY CASCADE');
  }
}
